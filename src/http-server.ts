/**
 * Streamable HTTP MCP Server with OAuth 2.1 Authentication
 *
 * Provides:
 * - OAuth 2.1 endpoints (RFC 9728, RFC 8414, RFC 7591, PKCE)
 * - Streamable HTTP transport at /mcp (POST, GET, DELETE)
 * - Bearer token middleware
 * - Per-session McpServer instances bound to authenticated users
 *
 * Environment Variables:
 * - PORT: Server port (default: 3000)
 * - HOST: Server host (default: 0.0.0.0)
 * - SERVER_URL: Public URL (default: http://localhost:3000)
 * - NODE_ENV: Environment (production/development)
 */

import { randomUUID } from 'crypto';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { GCPAuthService } from './auth/gcp-auth.js';
import { CircleAuth } from './auth/auth.js';
import { McpOAuthServer } from './auth/mcp-oauth-server.js';
import { SessionManager } from './auth/session-manager.js';
import { createMcpServer } from './server.js';
import { config, validateConfig } from './config/config.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('HttpServer');

// Extend Express Request to carry user email
declare global {
  namespace Express {
    interface Request {
      userEmail?: string;
    }
  }
}

// Configuration
const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate config
validateConfig();

// --- Initialize services ---

const gcpAuth = new GCPAuthService({
  clientId: config.gcpClientId,
  clientSecret: config.gcpClientSecret,
  redirectUri: `${config.serverUrl}/callback`,
  scopes: ['openid', 'email', 'profile'],
});

const circleAuth = new CircleAuth(config.headlessToken, config.communityUrl);
const oauthServer = new McpOAuthServer(gcpAuth, circleAuth);
const sessionManager = new SessionManager(oauthServer);

// Transport map: sessionId → { transport, email }
const transports = new Map<string, StreamableHTTPServerTransport>();

// --- Express app ---

const app = express();

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS === '*' ? '*' : (process.env.ALLOWED_ORIGINS?.split(',') || '*'),
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Mcp-Session-Id', 'Mcp-Protocol-Version'],
  exposedHeaders: ['Mcp-Session-Id'],
}));

// Request logging
app.use((req, _res, next) => {
  logger.debug('HTTP request', { method: req.method, path: req.path });
  next();
});

// --- OAuth Endpoints ---

app.get('/.well-known/oauth-protected-resource', (req, res) => {
  oauthServer.handleProtectedResourceMetadata(req, res);
});

app.get('/.well-known/oauth-authorization-server', (req, res) => {
  oauthServer.handleAuthorizationServerMetadata(req, res);
});

app.post('/register', express.json(), (req, res) => {
  oauthServer.handleRegister(req, res);
});

app.get('/authorize', (req, res) => {
  oauthServer.handleAuthorize(req, res);
});

app.get('/callback', async (req, res) => {
  await oauthServer.handleCallback(req, res);
});

app.post('/token', express.urlencoded({ extended: true }), express.json(), (req, res) => {
  oauthServer.handleToken(req, res);
});

// --- Bearer Token Middleware for /mcp ---

function bearerTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).set({
      'WWW-Authenticate': `Bearer resource_metadata="${config.serverUrl}/.well-known/oauth-protected-resource"`,
    }).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Unauthorized: Bearer token required' },
      id: null,
    });
    return;
  }

  const token = authHeader.slice(7);
  const email = sessionManager.resolveEmailFromToken(token);

  if (!email) {
    res.status(401).set({
      'WWW-Authenticate': `Bearer error="invalid_token", resource_metadata="${config.serverUrl}/.well-known/oauth-protected-resource"`,
    }).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Unauthorized: Invalid or expired token' },
      id: null,
    });
    return;
  }

  req.userEmail = email;
  next();
}

// --- MCP Endpoints ---

// Parse JSON body for POST /mcp (needed so we can inspect if it's an initialize request)
app.post('/mcp', bearerTokenMiddleware, express.json(), async (req: Request, res: Response) => {
  const email = req.userEmail!;
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  // If there's an existing session, route to it
  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res, req.body);
    return;
  }

  // If a session ID was provided but doesn't exist, return 404
  if (sessionId && !transports.has(sessionId)) {
    res.status(404).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Session not found. Please reinitialize.' },
      id: null,
    });
    return;
  }

  // No session ID — this should be an initialize request. Create a new transport + server.
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (newSessionId) => {
      // Store the transport mapped by session ID
      transports.set(newSessionId, transport);
      sessionManager.createSession(newSessionId, email);
      logger.info('New MCP session initialized', { sessionId: newSessionId, email });
    },
    onsessionclosed: (closedSessionId) => {
      transports.delete(closedSessionId);
      sessionManager.removeSession(closedSessionId);
      logger.info('MCP session closed', { sessionId: closedSessionId });
    },
  });

  // Create a per-session McpServer with email pre-injected
  const mcpServer = createMcpServer(email, sessionManager);
  await mcpServer.connect(transport);

  // Handle the initial request
  await transport.handleRequest(req, res, req.body);
});

app.get('/mcp', bearerTokenMiddleware, async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Invalid or missing session ID' },
      id: null,
    });
    return;
  }

  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

app.delete('/mcp', bearerTokenMiddleware, async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId || !transports.has(sessionId)) {
    res.status(404).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Session not found' },
      id: null,
    });
    return;
  }

  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

// --- Utility Endpoints ---

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    activeSessions: transports.size,
    transport: 'streamable-http',
  });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Circle MCP Server',
    version: '1.0.0',
    status: 'running',
    environment: NODE_ENV,
    transport: 'streamable-http',
    endpoints: {
      mcp: `${config.serverUrl}/mcp`,
      health: `${config.serverUrl}/health`,
      oauth_metadata: `${config.serverUrl}/.well-known/oauth-authorization-server`,
      resource_metadata: `${config.serverUrl}/.well-known/oauth-protected-resource`,
    },
    mcpConfig: {
      cursor: { mcpServers: { circle: { url: `${config.serverUrl}/mcp` } } },
      claudeDesktop: { mcpServers: { circle: { command: 'npx', args: ['-y', 'mcp-remote', `${config.serverUrl}/mcp`] } } },
      claudeCode: `claude mcp add circle --transport http ${config.serverUrl}/mcp`,
      vscode: { 'mcp.servers': { circle: { type: 'http', url: `${config.serverUrl}/mcp` } } },
    },
  });
});

// --- Start server ---

const server = app.listen(PORT, HOST, () => {
  logger.info('Circle MCP Server started', {
    environment: NODE_ENV,
    host: HOST,
    port: PORT,
    serverUrl: config.serverUrl,
  });

  console.log('\nCircle MCP Server is running!');
  console.log(`URL: ${config.serverUrl}`);
  console.log(`MCP Endpoint: ${config.serverUrl}/mcp`);
  console.log(`Health: ${config.serverUrl}/health`);
  console.log(`OAuth Metadata: ${config.serverUrl}/.well-known/oauth-authorization-server\n`);
});

// --- Graceful shutdown ---

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);

  // Close all active transports
  for (const [sessionId, transport] of transports) {
    logger.info('Closing session', { sessionId });
    await transport.close().catch(() => {});
  }
  transports.clear();

  // Cleanup OAuth server
  oauthServer.destroy();

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.warn('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, server };

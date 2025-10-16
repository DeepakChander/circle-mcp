/**
 * WebSocket MCP Server - Production Ready
 * Allows remote access via WebSocket for MCP protocol
 * Compatible with @modelcontextprotocol/client-websocket
 *
 * Environment Variables:
 * - PORT: Server port (default: 3000)
 * - HOST: Server host (default: 0.0.0.0)
 * - ALLOWED_ORIGINS: CORS allowed origins (comma-separated, default: *)
 * - PUBLIC_DOMAIN: Public domain for WebSocket URL (default: circle-mcp.duckdns.org)
 * - NODE_ENV: Environment (production/development)
 */

import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { CircleMCPServer } from './server.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('WebSocketServer');

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DOMAIN = process.env.PUBLIC_DOMAIN || 'circle-mcp.duckdns.org';
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({
  server: httpServer,
  maxPayload: 10 * 1024 * 1024, // 10MB max message size
  perMessageDeflate: true, // Enable compression
});

// Store active MCP server instances per WebSocket connection
const activeSessions = new Map<WebSocket, CircleMCPServer>();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, _res, next) => {
  logger.debug('HTTP request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    activeSessions: activeSessions.size,
    transport: 'websocket'
  });
});

// MCP Server info endpoint
app.get('/api/mcp/info', (_req: Request, res: Response) => {
  const wsUrl = Number(PORT) === 80 ? `ws://${PUBLIC_DOMAIN}` : `ws://${PUBLIC_DOMAIN}:${PORT}`;
  res.json({
    name: 'Circle MCP Server',
    version: '1.0.0',
    description: 'Production-grade MCP server for Circle.so community platform',
    capabilities: {
      tools: true,
      resources: true,
      prompts: true
    },
    transport: 'websocket',
    websocketUrl: wsUrl,
    toolCount: 20,
    features: [
      'Google OAuth 2.0 Authentication',
      'Profile Management',
      'Course Access',
      'Post Creation & Management',
      'Event Management',
      'Notifications',
      'Direct Messaging',
      'Space Management',
      'Comments & Interactions'
    ],
    documentation: 'https://github.com/yourusername/circle-mcp'
  });
});

// Root endpoint with client configuration
app.get('/', (_req: Request, res: Response) => {
  const wsUrl = Number(PORT) === 80 ? `ws://${PUBLIC_DOMAIN}` : `ws://${PUBLIC_DOMAIN}:${PORT}`;
  res.json({
    name: 'Circle MCP Server',
    version: '1.0.0',
    status: 'running',
    environment: NODE_ENV,
    transport: 'websocket',
    websocketUrl: wsUrl,
    endpoints: {
      health: '/health',
      info: '/api/mcp/info',
      websocket: wsUrl
    },
    documentation: 'https://github.com/yourusername/circle-mcp',
    setup: {
      description: 'Connect using Claude Desktop or any MCP-compatible client',
      claudeDesktop: {
        configFile: {
          windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
          mac: '~/Library/Application Support/Claude/claude_desktop_config.json',
          linux: '~/.config/Claude/claude_desktop_config.json'
        },
        config: {
          mcpServers: {
            circle: {
              command: 'npx',
              args: [
                '-y',
                '@modelcontextprotocol/client-websocket',
                wsUrl
              ]
            }
          }
        }
      }
    }
  });
});

// WebSocket MCP server
wss.on('connection', (ws: WebSocket) => {
  const clientId = Math.random().toString(36).substring(7);
  logger.info('New WebSocket connection', { clientId });

  try {
    // Create MCP server instance for this connection
    const mcpServer = new CircleMCPServer();
    activeSessions.set(ws, mcpServer);

    // Create transport that bridges WebSocket to MCP stdio
    const transport = {
      async start() {
        // MCP Server will send messages via onmessage callback
        // We relay them to WebSocket
      },
      async send(message: any) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      },
      async close() {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      },
      onmessage: null as ((message: any) => void) | null,
      onclose: null as (() => void) | null,
      onerror: null as ((error: Error) => void) | null
    };

    // Handle incoming WebSocket messages
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        logger.debug('Received message', { clientId, method: message.method });

        // Forward to MCP server transport
        if (transport.onmessage) {
          transport.onmessage(message);
        }
      } catch (error) {
        logger.error('Error processing message', error as Error, { clientId });
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error'
          }
        }));
      }
    });

    ws.on('close', () => {
      logger.info('WebSocket connection closed', { clientId });
      activeSessions.delete(ws);
      mcpServer.stop().catch(err => {
        logger.error('Error stopping MCP server', err);
      });
      if (transport.onclose) {
        transport.onclose();
      }
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error', error as Error, { clientId });
      if (transport.onerror) {
        transport.onerror(error as Error);
      }
    });

    // Connect MCP server to WebSocket transport
    mcpServer.server.connect(transport as any);

  } catch (error) {
    logger.error('Error setting up WebSocket connection', error as Error, { clientId });
    ws.close();
  }
});

// Start HTTP/WebSocket server
httpServer.listen(Number(PORT), HOST, () => {
  const wsUrl = Number(PORT) === 80 ? `ws://${PUBLIC_DOMAIN}` : `ws://${PUBLIC_DOMAIN}:${PORT}`;
  logger.info(`Circle MCP WebSocket Server started successfully`, {
    environment: NODE_ENV,
    host: HOST,
    port: PORT,
    localUrl: `http://localhost:${PORT}`,
    publicUrl: wsUrl,
    activeSessions: activeSessions.size,
    endpoints: {
      health: `http://localhost:${PORT}/health`,
      info: `http://localhost:${PORT}/api/mcp/info`,
      root: `http://localhost:${PORT}/`
    }
  });

  console.log('\n🚀 Circle MCP Server is running!');
  console.log(`📡 WebSocket URL: ${wsUrl}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📖 Documentation: http://localhost:${PORT}/api/mcp/info\n`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);

  // Close all active WebSocket connections
  for (const [ws, server] of activeSessions.entries()) {
    logger.info('Closing WebSocket connection');
    await server.stop();
    ws.close();
  }
  activeSessions.clear();

  // Close WebSocket server
  wss.close(() => {
    logger.info('WebSocket server closed');
  });

  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.warn('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, httpServer, wss };

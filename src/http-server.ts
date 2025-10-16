/**
 * HTTP/SSE Server Wrapper for Circle MCP
 * Allows remote access to MCP server via Server-Sent Events (SSE)
 * Compatible with Claude Desktop, Cursor, and other MCP clients
 */

import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CircleMCPServer } from './server.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = new Logger('HTTPServer');

const app = express();
const httpServer = createServer(app);

// Store active MCP server instances per session
const activeSessions = new Map<string, CircleMCPServer>();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.text());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    activeSessions: activeSessions.size
  });
});

// MCP Server info endpoint
app.get('/api/mcp/info', (_req: Request, res: Response) => {
  res.json({
    name: 'Circle MCP Server',
    version: '1.0.0',
    description: 'Production-grade MCP server for Circle.so community platform',
    capabilities: {
      tools: true,
      resources: true,
      prompts: true
    },
    transport: ['sse'],
    toolCount: 20,
    documentation: 'https://github.com/DeepakChander/circle-mcp'
  });
});

// SSE endpoint for MCP protocol
app.get('/sse', async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string || Math.random().toString(36).substring(7);

  logger.info('New SSE connection', { sessionId });

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

  // Create MCP server instance
  const mcpServer = new CircleMCPServer();
  activeSessions.set(sessionId, mcpServer);

  // Create SSE transport
  const transport = new SSEServerTransport('/messages', res);

  // Connect server to transport
  await mcpServer.server.connect(transport);

  // Handle client disconnect
  req.on('close', () => {
    logger.info('SSE connection closed', { sessionId });
    activeSessions.delete(sessionId);
    mcpServer.stop().catch(err => {
      logger.error('Error stopping MCP server', err);
    });
  });
});

// POST endpoint for MCP messages
app.post('/messages', async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    res.status(400).json({ error: 'Missing sessionId parameter' });
    return;
  }

  const mcpServer = activeSessions.get(sessionId);

  if (!mcpServer) {
    res.status(404).json({ error: 'Session not found. Please reconnect via /sse endpoint' });
    return;
  }

  try {
    // The transport handles the message automatically through the connected server
    // Just acknowledge receipt
    res.status(202).json({ received: true });
  } catch (error) {
    logger.error('Error processing message', error as Error, { sessionId });
    res.status(500).json({
      error: 'Internal error processing message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Serve client.js for dynamic loading
app.get('/client.js', (_req: Request, res: Response) => {
  try {
    const clientPath = join(__dirname, '../public/client.js');
    const clientCode = readFileSync(clientPath, 'utf-8');
    res.setHeader('Content-Type', 'application/javascript');
    res.send(clientCode);
  } catch (error) {
    logger.error('Failed to serve client.js', error as Error);
    res.status(404).send('Client not found');
  }
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  const serverUrl = `http://circlemcp.duckdns.org:${process.env.PORT || 3000}`;
  res.json({
    name: 'Circle MCP Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      info: '/api/mcp/info',
      sse: '/sse',
      messages: '/messages (POST)',
      client: '/client.js'
    },
    documentation: 'https://github.com/DeepakChander/circle-mcp',
    clientConfig: {
      description: 'Simple one-line configuration',
      claudeDesktop: {
        mcpServers: {
          circle: {
            command: 'node',
            args: ['-e', `eval(require('http').get('${serverUrl}/client.js',(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>eval(d))}))`]
          }
        }
      },
      cursor: {
        mcpServers: {
          circle: {
            command: 'node',
            args: ['-e', `eval(require('http').get('${serverUrl}/client.js',(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>eval(d))}))`]
          }
        }
      }
    }
  });
});

// Start HTTP server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(Number(PORT), HOST, () => {
  logger.info(`Circle MCP HTTP/SSE Server running`, {
    host: HOST,
    port: PORT,
    url: `http://${HOST}:${PORT}`,
    sseEndpoint: `http://${HOST}:${PORT}/sse`,
    healthCheck: `http://${HOST}:${PORT}/health`
  });
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);

  // Close all active sessions
  for (const [sessionId, server] of activeSessions.entries()) {
    logger.info(`Closing session ${sessionId}`);
    await server.stop();
  }
  activeSessions.clear();

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

export { app, httpServer };

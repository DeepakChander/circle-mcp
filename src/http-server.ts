/**
 * HTTP/WebSocket Server Wrapper for Circle MCP
 * Allows remote access to MCP server via HTTP and WebSocket
 */

import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { CircleMCPServer } from './server.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('HTTPServer');

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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
      resources: false,
      prompts: false
    },
    transport: ['websocket', 'http']
  });
});

// WebSocket connection handler for MCP protocol
wss.on('connection', (ws: WebSocket, _req) => {
  const clientId = Math.random().toString(36).substring(7);
  logger.info('New WebSocket connection', { clientId });

  // Create a dedicated MCP server instance for this connection
  const mcpServer = new CircleMCPServer();

  // Handle incoming WebSocket messages
  ws.on('message', async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      logger.debug('Received MCP message', { clientId, method: message.method });

      // Process MCP message
      // Note: This is a simplified handler. In production, you'd use the MCP SDK's transport layer
      const response = await handleMcpMessage(mcpServer, message);

      ws.send(JSON.stringify(response));
    } catch (error) {
      logger.error('Error processing WebSocket message', error as Error, { clientId });
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal error processing message'
        }
      }));
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket connection closed', { clientId });
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error', error as Error, { clientId });
  });

  // Send connection acknowledgment
  ws.send(JSON.stringify({
    type: 'connection',
    status: 'connected',
    clientId
  }));
});

/**
 * Handle MCP protocol messages
 */
async function handleMcpMessage(_server: CircleMCPServer, message: any): Promise<any> {
  // This is a placeholder - implement proper MCP message handling
  // using the SDK's protocol handlers

  if (message.method === 'tools/list') {
    // Return available tools
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: [] // Server will populate this
      }
    };
  }

  if (message.method === 'tools/call') {
    // Execute tool
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        content: [{
          type: 'text',
          text: 'Tool execution result'
        }]
      }
    };
  }

  return {
    jsonrpc: '2.0',
    id: message.id,
    error: {
      code: -32601,
      message: 'Method not found'
    }
  };
}

// Start HTTP/WebSocket server
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(Number(PORT), HOST, () => {
  logger.info(`Circle MCP HTTP/WebSocket Server running`, {
    host: HOST,
    port: PORT,
    httpUrl: `http://${HOST}:${PORT}`,
    wsUrl: `ws://${HOST}:${PORT}`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export { app, httpServer, wss };

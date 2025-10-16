#!/usr/bin/env node

/**
 * Circle MCP Client Proxy
 * Connects local MCP clients (Claude Desktop, Cursor) to remote Circle MCP server via SSE
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js');
const readline = require('readline');

// Get server URL from environment variable
const SERVER_URL = process.env.CIRCLE_MCP_SERVER_URL || 'http://localhost:3001';

// Ensure URL has no trailing slash
const baseUrl = SERVER_URL.replace(/\/$/, '');

// Session ID for this connection
const sessionId = Math.random().toString(36).substring(7);

console.error('🔌 Circle MCP Client starting...');
console.error(`📡 Server URL: ${baseUrl}`);
console.error(`🔑 Session ID: ${sessionId}`);

// Create MCP client
const client = new Client(
  {
    name: 'circle-mcp-client',
    version: '1.0.0'
  },
  {
    capabilities: {}
  }
);

// Create SSE transport
const transport = new SSEClientTransport(
  new URL(`${baseUrl}/sse?sessionId=${sessionId}`),
  new URL(`${baseUrl}/messages?sessionId=${sessionId}`)
);

// Connect to server
async function connect() {
  try {
    console.error('🔄 Connecting to Circle MCP server...');
    await client.connect(transport);
    console.error('✅ Connected successfully!');
    console.error('💬 Ready to process MCP messages\n');
  } catch (error) {
    console.error('❌ Failed to connect:', error.message);
    console.error('\n📋 Troubleshooting:');
    console.error(`   1. Check if server is running: curl ${baseUrl}/health`);
    console.error(`   2. Verify CIRCLE_MCP_SERVER_URL is correct: ${SERVER_URL}`);
    console.error(`   3. Check network connectivity to the server`);
    console.error(`   4. Review server logs for errors\n`);
    process.exit(1);
  }
}

// Setup stdin/stdout communication for MCP protocol
function setupStdioProxy() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', async (line) => {
    if (!line.trim()) return;

    try {
      const request = JSON.parse(line);

      // Handle different MCP methods
      if (request.method === 'tools/list') {
        const response = await client.listTools();
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: response
        }) + '\n');
      } else if (request.method === 'tools/call') {
        const response = await client.callTool({
          name: request.params.name,
          arguments: request.params.arguments || {}
        });
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: response
        }) + '\n');
      } else if (request.method === 'resources/list') {
        const response = await client.listResources();
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: response
        }) + '\n');
      } else if (request.method === 'resources/read') {
        const response = await client.readResource({
          uri: request.params.uri
        });
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: response
        }) + '\n');
      } else if (request.method === 'prompts/list') {
        const response = await client.listPrompts();
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: response
        }) + '\n');
      } else if (request.method === 'prompts/get') {
        const response = await client.getPrompt({
          name: request.params.name,
          arguments: request.params.arguments || {}
        });
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: response
        }) + '\n');
      } else if (request.method === 'initialize') {
        const response = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
            prompts: {}
          },
          serverInfo: {
            name: 'circle-mcp-client',
            version: '1.0.0'
          }
        };
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: response
        }) + '\n');
      } else {
        // Unknown method
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`
          }
        }) + '\n');
      }
    } catch (error) {
      console.error('⚠️  Error processing request:', error.message);
      try {
        const request = JSON.parse(line);
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32603,
            message: error.message
          }
        }) + '\n');
      } catch {
        // If we can't parse the original request, just log the error
      }
    }
  });
}

// Handle process termination
process.on('SIGINT', async () => {
  console.error('\n👋 Shutting down...');
  try {
    await client.close();
  } catch (err) {
    console.error('Error during shutdown:', err.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  try {
    await client.close();
  } catch (err) {
    console.error('Error during shutdown:', err.message);
  }
  process.exit(0);
});

// Start the client
connect()
  .then(() => {
    setupStdioProxy();
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

#!/usr/bin/env node

/**
 * Circle MCP Client Proxy
 * Connects local MCP clients (Claude Desktop, Cursor) to remote Circle MCP server
 *
 * Usage: node client-proxy.js <server-url>
 * Example: node client-proxy.js http://54.221.177.237:3001
 */

const WebSocket = require('ws');
const readline = require('readline');

// Get server URL from command line argument or environment variable
const SERVER_URL = process.argv[2] || process.env.CIRCLE_MCP_SERVER_URL;

if (!SERVER_URL) {
  console.error('Error: Server URL is required');
  console.error('Usage: node client-proxy.js <server-url>');
  console.error('Example: node client-proxy.js http://54.221.177.237:3001');
  process.exit(1);
}

// Convert HTTP URL to WebSocket URL
const wsUrl = SERVER_URL.replace(/^http/, 'ws');

let ws;
let messageQueue = [];
let connected = false;

// Connect to remote MCP server via WebSocket
function connect() {
  ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    connected = true;
    console.error('Connected to Circle MCP server at', wsUrl);

    // Send queued messages
    while (messageQueue.length > 0) {
      const msg = messageQueue.shift();
      ws.send(msg);
    }
  });

  ws.on('message', (data) => {
    // Forward responses to stdout (for MCP client)
    const message = data.toString();

    // Skip connection acknowledgment messages
    if (message.includes('"type":"connection"')) {
      return;
    }

    // Forward JSON-RPC messages to stdout
    try {
      const parsed = JSON.parse(message);
      if (parsed.jsonrpc || parsed.result || parsed.error) {
        process.stdout.write(message + '\n');
      }
    } catch (e) {
      // If not valid JSON, skip it
    }
  });

  ws.on('close', () => {
    connected = false;
    console.error('Disconnected from Circle MCP server');

    // Attempt reconnect after 5 seconds
    setTimeout(() => {
      console.error('Attempting to reconnect...');
      connect();
    }, 5000);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });
}

// Read from stdin (MCP client requests)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  if (!line.trim()) return;

  if (connected) {
    // Send to remote server
    ws.send(line);
  } else {
    // Queue messages until connected
    messageQueue.push(line);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.error('\nShutting down...');
  if (ws) {
    ws.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (ws) {
    ws.close();
  }
  process.exit(0);
});

// Start connection
console.error('Connecting to Circle MCP server...');
connect();

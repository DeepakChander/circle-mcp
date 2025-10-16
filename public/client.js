#!/usr/bin/env node
/**
 * Circle MCP Client - Dynamically loaded from server
 * Uses CommonJS for inline eval compatibility
 */
(async () => {
  try {
    // Dynamically import MCP SDK (ESM)
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    const { SSEClientTransport } = await import('@modelcontextprotocol/sdk/client/sse.js');
    const readline = require('readline');

    const serverUrl = process.env.CIRCLE_MCP_URL || 'http://circlemcp.duckdns.org:3000';
    const sessionId = Math.random().toString(36).substring(7);

    const client = new Client(
      { name: 'circle-mcp-client', version: '1.0.0' },
      { capabilities: {} }
    );

    const transport = new SSEClientTransport(
      new URL(`${serverUrl}/sse?sessionId=${sessionId}`),
      new URL(`${serverUrl}/messages?sessionId=${sessionId}`)
    );

    await client.connect(transport);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', async (line) => {
      if (!line.trim()) return;
      try {
        const req = JSON.parse(line);
        let result;

        switch (req.method) {
          case 'tools/list':
            result = await client.listTools();
            break;
          case 'tools/call':
            result = await client.callTool({
              name: req.params.name,
              arguments: req.params.arguments || {}
            });
            break;
          case 'resources/list':
            result = await client.listResources();
            break;
          case 'resources/read':
            result = await client.readResource({ uri: req.params.uri });
            break;
          case 'prompts/list':
            result = await client.listPrompts();
            break;
          case 'prompts/get':
            result = await client.getPrompt({
              name: req.params.name,
              arguments: req.params.arguments || {}
            });
            break;
          case 'initialize':
            result = {
              protocolVersion: '2024-11-05',
              capabilities: { tools: {}, resources: {}, prompts: {} },
              serverInfo: { name: 'circle-mcp-client', version: '1.0.0' }
            };
            break;
          default:
            result = { error: { code: -32601, message: `Method not found: ${req.method}` } };
        }

        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, result }) + '\n');
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('Request error:', errMsg);
        try {
          const req = JSON.parse(line);
          process.stdout.write(JSON.stringify({
            jsonrpc: '2.0',
            id: req.id,
            error: { code: -32603, message: errMsg }
          }) + '\n');
        } catch {}
      }
    });

    const cleanup = async () => {
      try {
        await client.close();
      } catch {}
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (err) {
    console.error('Fatal error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
})();

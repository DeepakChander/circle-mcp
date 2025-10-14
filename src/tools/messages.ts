import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CircleAPIClient } from '../api/client.js';
import type { IntegratedAuthManager } from '../auth/integrated-auth-manager.js';

export function registerMessageTools(
  server: McpServer,
  _apiClient: CircleAPIClient,
  _authManager: IntegratedAuthManager
) {
  server.registerTool(
    'get_messages',
    {
      title: 'Get Messages',
      description: 'List your direct messages',
      inputSchema: {
        page: z.number().int().positive().default(1),
        per_page: z.number().int().positive().max(100).default(20),
      },
    },
    async () => {
      return {
        content: [{
          type: 'text',
          text: 'Messages feature coming soon',
        }],
      };
    }
  );
}
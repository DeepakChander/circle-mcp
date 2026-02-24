import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CircleAPIClient } from '../api/client.js';
import type { IntegratedAuthManager } from '../auth/integrated-auth-manager.js';
import { endpoints } from '../api/endpoints.js';
import { Logger } from '../utils/logger.js';
import { withAuthentication, withSessionAuth } from './auth-wrapper.js';

const logger = new Logger('FeedTools');

function createGetFeedHandler(apiClient: CircleAPIClient) {
  return async (params: any) => {
    try {
      const email = params.authenticatedEmail;
      const response = await apiClient.get(endpoints.getFeed(params), email);

      return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
    } catch (error) {
      logger.error('Failed to get feed', error as Error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errorMsg.includes('404')) {
        return { content: [{ type: 'text', text: `Home Feed feature is not available.\n\nThis endpoint may not be accessible with your current permissions. Try using 'get_posts' to see community posts instead.` }] };
      }
      return { content: [{ type: 'text', text: `Error: ${errorMsg}` }], isError: true };
    }
  };
}

export function registerFeedToolsForSession(
  server: McpServer,
  apiClient: CircleAPIClient,
  email: string
): void {
  server.registerTool('get_feed', {
    title: 'Get Home Feed', description: 'Get your personalized home feed',
    inputSchema: {
      page: z.number().int().positive().default(1),
      per_page: z.number().int().positive().max(100).default(20),
      sort: z.enum(['latest', 'popular']).default('latest').optional(),
    },
  }, withSessionAuth(email, createGetFeedHandler(apiClient)));
}

export function registerFeedTools(
  server: McpServer,
  apiClient: CircleAPIClient,
  authManager: IntegratedAuthManager
) {
  server.registerTool(
    'get_feed',
    {
      title: 'Get Home Feed',
      description: 'Get your personalized home feed',
      inputSchema: {
        page: z.number().int().positive().default(1),
        per_page: z.number().int().positive().max(100).default(20),
        sort: z.enum(['latest', 'popular']).default('latest').optional(),
      },
    },
    withAuthentication(authManager, async (params) => {
      try {
        const email = (params as any).authenticatedEmail;
        const response = await apiClient.get(
          endpoints.getFeed(params),
          email
        );

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2),
          }],
        };
      } catch (error) {
        logger.error('Failed to get feed', error as Error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        // Check if it's a 404 error
        if (errorMsg.includes('404')) {
          return {
            content: [{
              type: 'text',
              text: `⚠️  Home Feed feature is not available.\n\nThis endpoint may not be accessible with your current permissions. Try using 'get_posts' to see community posts instead.\n\nContact the community administrator if you believe this is an error.`,
            }],
          };
        }

        return {
          content: [{
            type: 'text',
            text: `Error: ${errorMsg}`,
          }],
          isError: true,
        };
      }
    })
  );
}
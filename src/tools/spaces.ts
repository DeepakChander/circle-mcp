import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CircleAPIClient } from '../api/client.js';
import type { IntegratedAuthManager } from '../auth/integrated-auth-manager.js';
import { endpoints } from '../api/endpoints.js';
import { Logger } from '../utils/logger.js';
import type { CircleSpace } from '../types/index.js';
import { withAuthentication, withSessionAuth } from './auth-wrapper.js';
import { extractArrayFromResponse, formatErrorMessage } from '../utils/response-handler.js';

const logger = new Logger('SpaceTools');

function createGetSpacesHandler(apiClient: CircleAPIClient) {
  return async (params: any) => {
    try {
      const email = params.authenticatedEmail;
      const response = await apiClient.get<any>(endpoints.getSpaces(), email);
      const spacesArray = extractArrayFromResponse<CircleSpace>(response);

      if (spacesArray.length === 0) {
        return { content: [{ type: 'text', text: 'No spaces found. The community may not have any spaces configured yet.' }] };
      }

      const spaceList = spacesArray.map(space => ({
        id: space.id, name: space.name, description: space.description || 'No description',
        posts: space.posts_count || 0, members: space.members_count || 0,
      }));

      return { content: [{ type: 'text', text: JSON.stringify({ total: spaceList.length, spaces: spaceList }, null, 2) }] };
    } catch (error) {
      logger.error('Failed to get spaces', error as Error);
      return { content: [{ type: 'text', text: `Error: ${formatErrorMessage(error)}` }], isError: true };
    }
  };
}

export function registerSpaceToolsForSession(
  server: McpServer,
  apiClient: CircleAPIClient,
  email: string
): void {
  server.registerTool('get_spaces', {
    title: 'Get Spaces', description: 'List all available community spaces',
    inputSchema: {},
  }, withSessionAuth(email, createGetSpacesHandler(apiClient)));
}

export function registerSpaceTools(
  server: McpServer,
  apiClient: CircleAPIClient,
  authManager: IntegratedAuthManager
) {
  server.registerTool(
    'get_spaces',
    {
      title: 'Get Spaces',
      description: 'List all available community spaces',
      inputSchema: {}, // FIXED: Empty object
    },
    withAuthentication(authManager, async (params) => {
      try {
        const email = (params as any).authenticatedEmail;
        const response = await apiClient.get<any>(
          endpoints.getSpaces(),
          email
        );

        // Robustly extract spaces array from response
        const spacesArray = extractArrayFromResponse<CircleSpace>(response);

        if (spacesArray.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No spaces found. The community may not have any spaces configured yet.',
            }],
          };
        }

        const spaceList = spacesArray.map(space => ({
          id: space.id,
          name: space.name,
          description: space.description || 'No description',
          posts: space.posts_count || 0,
          members: space.members_count || 0,
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ total: spaceList.length, spaces: spaceList }, null, 2),
          }],
        };
      } catch (error) {
        logger.error('Failed to get spaces', error as Error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${formatErrorMessage(error)}`,
          }],
          isError: true,
        };
      }
    })
  );
}
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CircleAPIClient } from '../api/client.js';
import type { IntegratedAuthManager } from '../auth/integrated-auth-manager.js';
import { endpoints } from '../api/endpoints.js';
import { Logger } from '../utils/logger.js';
import type { CircleNotification, PaginatedResponse } from '../types/index.js';
import { withAuthentication } from './auth-wrapper.js';

const logger = new Logger('NotificationTools');

export function registerNotificationTools(
  server: McpServer,
  apiClient: CircleAPIClient,
  authManager: IntegratedAuthManager
) {
  server.registerTool(
    'get_notifications',
    {
      title: 'Get Notifications',
      description: 'List your notifications',
      inputSchema: { // FIXED
        page: z.number().int().positive().default(1),
        per_page: z.number().int().positive().max(100).default(20),
      },
    },
    withAuthentication(authManager, async (params) => {
      try {
        const email = (params as any).authenticatedEmail;
        const response = await apiClient.get<PaginatedResponse<CircleNotification>>(
          endpoints.getNotifications(params),
          email
        );

        const notifications = response.records.map(notif => ({
          id: notif.id,
          type: notif.type,
          read: notif.read,
          created: notif.created_at,
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total: response.count,
              unread: notifications.filter(n => !n.read).length,
              notifications,
            }, null, 2),
          }],
        };
      } catch (error) {
        logger.error('Failed to get notifications', error as Error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        // Check if it's a 404 error
        if (errorMsg.includes('404')) {
          return {
            content: [{
              type: 'text',
              text: `⚠️  Notifications feature is not available.\n\nThis endpoint may not be accessible with your current permissions, or notifications may not be enabled for this community.\n\nContact the community administrator if you believe this is an error.`,
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
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CircleAPIClient } from '../api/client.js';
import type { IntegratedAuthManager } from '../auth/integrated-auth-manager.js';
import { registerProfileTools } from './profile.js';
import { registerCourseTools } from './courses.js';
import { registerPostTools } from './posts.js';
import { registerSpaceTools } from './spaces.js';
import { registerEventTools } from './events.js';
import { registerNotificationTools } from './notifications.js';
import { registerMessageTools } from './messages.js';
import { registerFeedTools } from './feed.js';
import { registerCommentTools } from './comments.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('ToolRegistry');

export function registerAllTools(
  server: McpServer,
  apiClient: CircleAPIClient,
  authManager: IntegratedAuthManager,
  readOnlyMode: boolean
): void {
  logger.info('Registering all tools', { readOnlyMode });

  registerProfileTools(server, apiClient, authManager);
  registerCourseTools(server, apiClient, authManager);
  registerPostTools(server, apiClient, authManager, readOnlyMode);
  registerSpaceTools(server, apiClient, authManager);
  registerEventTools(server, apiClient, authManager, readOnlyMode);
  registerNotificationTools(server, apiClient, authManager);
  registerMessageTools(server, apiClient, authManager);
  registerFeedTools(server, apiClient, authManager);
  registerCommentTools(server, apiClient, authManager, readOnlyMode);

  logger.info('All tools registered successfully');
}
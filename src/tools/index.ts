import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CircleAPIClient } from '../api/client.js';
import type { IntegratedAuthManager } from '../auth/integrated-auth-manager.js';
import { registerProfileTools, registerProfileToolsForSession } from './profile.js';
import { registerCourseTools, registerCourseToolsForSession } from './courses.js';
import { registerPostTools, registerPostToolsForSession } from './posts.js';
import { registerSpaceTools, registerSpaceToolsForSession } from './spaces.js';
import { registerEventTools, registerEventToolsForSession } from './events.js';
import { registerNotificationTools, registerNotificationToolsForSession } from './notifications.js';
import { registerMessageTools, registerMessageToolsForSession } from './messages.js';
import { registerFeedTools, registerFeedToolsForSession } from './feed.js';
import { registerCommentTools, registerCommentToolsForSession } from './comments.js';
import { registerAdminMemberTools, registerAdminMemberToolsForSession } from './admin-members.js';
import { registerAdminSpaceTools, registerAdminSpaceToolsForSession } from './admin-spaces.js';
import { registerAdminContentTools, registerAdminContentToolsForSession } from './admin-content.js';
import { registerAdminEventTools, registerAdminEventToolsForSession } from './admin-events.js';
import { registerAdminCourseTools, registerAdminCourseToolsForSession } from './admin-courses.js';
import { registerAdminAccessTools, registerAdminAccessToolsForSession } from './admin-access.js';
import { registerAdminEngagementTools, registerAdminEngagementToolsForSession } from './admin-engagement.js';
import { registerAdminCommunityTools, registerAdminCommunityToolsForSession } from './admin-community.js';
import { isAdminV2Configured } from '../api/admin-v2-client.js';
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

  // Admin V2 API tools (only if token is configured)
  if (isAdminV2Configured()) {
    logger.info('Admin V2 token detected, registering admin tools');
    registerAdminMemberTools(server, readOnlyMode);
    registerAdminSpaceTools(server, readOnlyMode);
    registerAdminContentTools(server, readOnlyMode);
    registerAdminEventTools(server, readOnlyMode);
    registerAdminCourseTools(server, readOnlyMode);
    registerAdminAccessTools(server, readOnlyMode);
    registerAdminEngagementTools(server, readOnlyMode);
    registerAdminCommunityTools(server, readOnlyMode);
  }

  logger.info('All tools registered successfully');
}

export function registerAllToolsForSession(
  server: McpServer,
  apiClient: CircleAPIClient,
  email: string,
  readOnlyMode: boolean
): void {
  logger.info('Registering all tools for session', { email, readOnlyMode });

  registerProfileToolsForSession(server, apiClient, email);
  registerCourseToolsForSession(server, apiClient, email);
  registerPostToolsForSession(server, apiClient, email, readOnlyMode);
  registerSpaceToolsForSession(server, apiClient, email);
  registerEventToolsForSession(server, apiClient, email, readOnlyMode);
  registerNotificationToolsForSession(server, apiClient, email);
  registerMessageToolsForSession(server, apiClient, email);
  registerFeedToolsForSession(server, apiClient, email);
  registerCommentToolsForSession(server, apiClient, email, readOnlyMode);

  // Admin V2 API tools (only if token is configured)
  if (isAdminV2Configured()) {
    logger.info('Admin V2 token detected, registering admin tools for session');
    registerAdminMemberToolsForSession(server, readOnlyMode);
    registerAdminSpaceToolsForSession(server, readOnlyMode);
    registerAdminContentToolsForSession(server, readOnlyMode);
    registerAdminEventToolsForSession(server, readOnlyMode);
    registerAdminCourseToolsForSession(server, readOnlyMode);
    registerAdminAccessToolsForSession(server, readOnlyMode);
    registerAdminEngagementToolsForSession(server, readOnlyMode);
    registerAdminCommunityToolsForSession(server, readOnlyMode);
  }

  logger.info('All tools registered successfully for session');
}

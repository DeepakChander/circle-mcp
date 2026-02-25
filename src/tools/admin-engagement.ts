import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { adminV2Request } from '../api/admin-v2-client.js';
import { ADMIN_V2_ENDPOINTS } from '../config/constants.js';
import { Logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/response-handler.js';

const logger = new Logger('AdminEngagementTools');

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function err(text: string) {
  return { content: [{ type: 'text' as const, text }], isError: true };
}

export function registerAdminEngagementTools(server: McpServer, readOnlyMode: boolean): void {
  // --- Read tools (4) ---

  server.registerTool(
    'admin_get_leaderboard',
    {
      title: 'Admin: Get Leaderboard',
      description: 'Get the gamification leaderboard (Admin V2 API)',
      inputSchema: {
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.LEADERBOARD,
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to get leaderboard', error as Error);
        return err(`Failed to get leaderboard: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_member_tags',
    {
      title: 'Admin: List Member Tags',
      description: 'List all member tags in the community (Admin V2 API)',
      inputSchema: {
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.MEMBER_TAG_LIST,
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list member tags', error as Error);
        return err(`Failed to list member tags: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_member_tags_for_member',
    {
      title: 'Admin: List Tags for Member',
      description: 'List tags assigned to a specific member (Admin V2 API)',
      inputSchema: {
        community_member_id: z.number().int().positive().describe('Member ID'),
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.MEMBER_TAG_LIST,
          params: { community_member_id: params.community_member_id, page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list member tags for member', error as Error);
        return err(`Failed to list member tags: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_search_members_by_email',
    {
      title: 'Admin: Search Members by Email',
      description: 'Find members by email address (Admin V2 API)',
      inputSchema: {
        email: z.string().min(1).describe('Email address to search for'),
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.MEMBERS,
          params: { email: params.email, page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to search members by email', error as Error);
        return err(`Failed to search members: ${formatErrorMessage(error)}`);
      }
    }
  );

  // --- Destructive tools (5) ---

  if (!readOnlyMode) {
    server.registerTool(
      'admin_create_member_tag',
      {
        title: 'Admin: Create Member Tag',
        description: 'Create a new member tag (Admin V2 API)',
        inputSchema: {
          name: z.string().min(1).max(255).describe('Tag name'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.MEMBER_TAG_LIST,
            data: { name: params.name },
          });
          return ok(`Member tag created successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to create member tag', error as Error);
          return err(`Failed to create member tag: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_update_member_tag',
      {
        title: 'Admin: Update Member Tag',
        description: 'Update a member tag (Admin V2 API)',
        inputSchema: {
          tag_id: z.number().int().positive().describe('Tag ID'),
          name: z.string().min(1).max(255).describe('Updated tag name'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'PATCH',
            endpoint: ADMIN_V2_ENDPOINTS.MEMBER_TAG(params.tag_id),
            data: { name: params.name },
          });
          return ok(`Member tag updated successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to update member tag', error as Error);
          return err(`Failed to update member tag: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_delete_member_tag',
      {
        title: 'Admin: Delete Member Tag',
        description: 'Delete a member tag (Admin V2 API)',
        inputSchema: {
          tag_id: z.number().int().positive().describe('Tag ID to delete'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.MEMBER_TAG(params.tag_id),
          });
          return ok('Member tag deleted successfully.');
        } catch (error) {
          logger.error('Failed to delete member tag', error as Error);
          return err(`Failed to delete member tag: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_tag_member',
      {
        title: 'Admin: Tag Member',
        description: 'Add a tag to a community member (Admin V2 API)',
        inputSchema: {
          member_id: z.number().int().positive().describe('Member ID'),
          tag_id: z.number().int().positive().describe('Tag ID to assign'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.MEMBER_TAG_LIST,
            data: { community_member_id: params.member_id, member_tag_id: params.tag_id },
          });
          return ok(`Tag assigned to member:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to tag member', error as Error);
          return err(`Failed to tag member: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_send_member_message',
      {
        title: 'Admin: Send Member Message',
        description: 'Send a direct message to a community member (Admin V2 API)',
        inputSchema: {
          member_id: z.number().int().positive().describe('Member ID to message'),
          body: z.string().min(1).describe('Message body'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.MEMBER_MESSAGE(params.member_id),
            data: { body: params.body },
          });
          return ok(`Message sent successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to send message', error as Error);
          return err(`Failed to send message: ${formatErrorMessage(error)}`);
        }
      }
    );
  }
}

export function registerAdminEngagementToolsForSession(server: McpServer, readOnlyMode: boolean): void {
  registerAdminEngagementTools(server, readOnlyMode);
}

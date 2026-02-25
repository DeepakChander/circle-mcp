import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { adminV2Request } from '../api/admin-v2-client.js';
import { ADMIN_V2_ENDPOINTS } from '../config/constants.js';
import { Logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/response-handler.js';

const logger = new Logger('AdminMemberTools');

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function err(text: string) {
  return { content: [{ type: 'text' as const, text }], isError: true };
}

export function registerAdminMemberTools(server: McpServer, readOnlyMode: boolean): void {
  // --- Read tools ---

  server.registerTool(
    'admin_list_members',
    {
      title: 'Admin: List Members',
      description: 'List all community members with pagination (Admin V2 API)',
      inputSchema: {
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page (max 100)'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.MEMBERS,
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list members', error as Error);
        return err(`Failed to list members: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_get_member',
    {
      title: 'Admin: Get Member',
      description: 'Get a specific community member by ID (Admin V2 API)',
      inputSchema: {
        member_id: z.number().int().positive().describe('Member ID'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.MEMBER(params.member_id),
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to get member', error as Error);
        return err(`Failed to get member: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_search_members',
    {
      title: 'Admin: Search Members',
      description: 'Search community members by email, name, or other criteria (Admin V2 API)',
      inputSchema: {
        query: z.string().min(1).describe('Search query (email, name, etc.)'),
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.MEMBER_SEARCH,
          params: { query: params.query, page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to search members', error as Error);
        return err(`Failed to search members: ${formatErrorMessage(error)}`);
      }
    }
  );

  // --- Destructive tools (gated by readOnlyMode) ---

  if (!readOnlyMode) {
    server.registerTool(
      'admin_invite_member',
      {
        title: 'Admin: Invite Member',
        description: 'Invite a new member to the community by email (Admin V2 API)',
        inputSchema: {
          email: z.string().email().describe('Email address to invite'),
          name: z.string().min(1).optional().describe('Display name for the member'),
          space_ids: z.array(z.number().int().positive()).optional().describe('Space IDs to add the member to'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.MEMBERS,
            data: {
              email: params.email,
              name: params.name,
              space_ids: params.space_ids,
            },
          });
          return ok(`Member invited successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to invite member', error as Error);
          return err(`Failed to invite member: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_update_member',
      {
        title: 'Admin: Update Member',
        description: 'Update a community member\'s profile or settings (Admin V2 API)',
        inputSchema: {
          member_id: z.number().int().positive().describe('Member ID to update'),
          name: z.string().min(1).optional().describe('Display name'),
          first_name: z.string().optional().describe('First name'),
          last_name: z.string().optional().describe('Last name'),
          headline: z.string().optional().describe('Headline'),
          bio: z.string().optional().describe('Bio'),
          admin: z.boolean().optional().describe('Set admin status'),
          moderator: z.boolean().optional().describe('Set moderator status'),
        },
      },
      async (params) => {
        try {
          const { member_id, ...updateData } = params;
          const data = await adminV2Request({
            method: 'PATCH',
            endpoint: ADMIN_V2_ENDPOINTS.MEMBER(member_id),
            data: updateData,
          });
          return ok(`Member updated successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to update member', error as Error);
          return err(`Failed to update member: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_ban_member',
      {
        title: 'Admin: Ban Member',
        description: 'Ban a community member (Admin V2 API)',
        inputSchema: {
          member_id: z.number().int().positive().describe('Member ID to ban'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.MEMBER_BAN(params.member_id),
          });
          return ok(`Member banned successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to ban member', error as Error);
          return err(`Failed to ban member: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_remove_member',
      {
        title: 'Admin: Remove Member',
        description: 'Remove a member from the community (Admin V2 API)',
        inputSchema: {
          member_id: z.number().int().positive().describe('Member ID to remove'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.MEMBER(params.member_id),
          });
          return ok('Member removed successfully.');
        } catch (error) {
          logger.error('Failed to remove member', error as Error);
          return err(`Failed to remove member: ${formatErrorMessage(error)}`);
        }
      }
    );
  }
}

export function registerAdminMemberToolsForSession(server: McpServer, readOnlyMode: boolean): void {
  registerAdminMemberTools(server, readOnlyMode);
}

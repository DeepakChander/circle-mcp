import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { adminV2Request } from '../api/admin-v2-client.js';
import { ADMIN_V2_ENDPOINTS } from '../config/constants.js';
import { Logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/response-handler.js';

const logger = new Logger('AdminAccessTools');

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function err(text: string) {
  return { content: [{ type: 'text' as const, text }], isError: true };
}

export function registerAdminAccessTools(server: McpServer, readOnlyMode: boolean): void {
  // --- Read tools ---

  server.registerTool(
    'admin_list_access_groups',
    {
      title: 'Admin: List Access Groups',
      description: 'List all access groups in the community (Admin V2 API)',
      inputSchema: {
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.ACCESS_GROUPS,
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list access groups', error as Error);
        return err(`Failed to list access groups: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_get_access_group',
    {
      title: 'Admin: Get Access Group',
      description: 'Get a specific access group by ID (Admin V2 API)',
      inputSchema: {
        access_group_id: z.number().int().positive().describe('Access group ID'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.ACCESS_GROUP(params.access_group_id),
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to get access group', error as Error);
        return err(`Failed to get access group: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_access_group_members',
    {
      title: 'Admin: List Access Group Members',
      description: 'List members in an access group (Admin V2 API)',
      inputSchema: {
        access_group_id: z.number().int().positive().describe('Access group ID'),
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.ACCESS_GROUP_MEMBERS(params.access_group_id),
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list access group members', error as Error);
        return err(`Failed to list access group members: ${formatErrorMessage(error)}`);
      }
    }
  );

  // --- Destructive tools ---

  if (!readOnlyMode) {
    server.registerTool(
      'admin_create_access_group',
      {
        title: 'Admin: Create Access Group',
        description: 'Create a new access group (Admin V2 API)',
        inputSchema: {
          name: z.string().min(1).max(255).describe('Access group name'),
          description: z.string().optional().describe('Access group description'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.ACCESS_GROUPS,
            data: params,
          });
          return ok(`Access group created successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to create access group', error as Error);
          return err(`Failed to create access group: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_update_access_group',
      {
        title: 'Admin: Update Access Group',
        description: 'Update an access group (Admin V2 API)',
        inputSchema: {
          access_group_id: z.number().int().positive().describe('Access group ID'),
          name: z.string().min(1).max(255).optional().describe('Access group name'),
          description: z.string().optional().describe('Access group description'),
        },
      },
      async (params) => {
        try {
          const { access_group_id, ...updateData } = params;
          const data = await adminV2Request({
            method: 'PATCH',
            endpoint: ADMIN_V2_ENDPOINTS.ACCESS_GROUP(access_group_id),
            data: updateData,
          });
          return ok(`Access group updated successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to update access group', error as Error);
          return err(`Failed to update access group: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_archive_access_group',
      {
        title: 'Admin: Archive Access Group',
        description: 'Archive an access group (Admin V2 API)',
        inputSchema: {
          access_group_id: z.number().int().positive().describe('Access group ID to archive'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.ACCESS_GROUP_ARCHIVE(params.access_group_id),
          });
          return ok(`Access group archived successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to archive access group', error as Error);
          return err(`Failed to archive access group: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_unarchive_access_group',
      {
        title: 'Admin: Unarchive Access Group',
        description: 'Unarchive an access group (Admin V2 API)',
        inputSchema: {
          access_group_id: z.number().int().positive().describe('Access group ID to unarchive'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.ACCESS_GROUP_UNARCHIVE(params.access_group_id),
          });
          return ok(`Access group unarchived successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to unarchive access group', error as Error);
          return err(`Failed to unarchive access group: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_add_access_group_member',
      {
        title: 'Admin: Add Access Group Member',
        description: 'Add a member to an access group (Admin V2 API)',
        inputSchema: {
          access_group_id: z.number().int().positive().describe('Access group ID'),
          community_member_id: z.number().int().positive().describe('Member ID to add'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.ACCESS_GROUP_MEMBERS(params.access_group_id),
            data: { community_member_id: params.community_member_id },
          });
          return ok(`Member added to access group:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to add access group member', error as Error);
          return err(`Failed to add access group member: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_remove_access_group_member',
      {
        title: 'Admin: Remove Access Group Member',
        description: 'Remove a member from an access group (Admin V2 API)',
        inputSchema: {
          access_group_id: z.number().int().positive().describe('Access group ID'),
          member_id: z.number().int().positive().describe('Member ID to remove'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.ACCESS_GROUP_MEMBER(params.access_group_id, params.member_id),
          });
          return ok('Member removed from access group successfully.');
        } catch (error) {
          logger.error('Failed to remove access group member', error as Error);
          return err(`Failed to remove access group member: ${formatErrorMessage(error)}`);
        }
      }
    );
  }
}

export function registerAdminAccessToolsForSession(server: McpServer, readOnlyMode: boolean): void {
  registerAdminAccessTools(server, readOnlyMode);
}

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { adminV2Request } from '../api/admin-v2-client.js';
import { ADMIN_V2_ENDPOINTS } from '../config/constants.js';
import { Logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/response-handler.js';

const logger = new Logger('AdminSpaceTools');

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function err(text: string) {
  return { content: [{ type: 'text' as const, text }], isError: true };
}

export function registerAdminSpaceTools(server: McpServer, readOnlyMode: boolean): void {
  // --- Read tools ---

  server.registerTool(
    'admin_list_spaces',
    {
      title: 'Admin: List Spaces',
      description: 'List all community spaces with pagination (Admin V2 API)',
      inputSchema: {
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.SPACES,
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list spaces', error as Error);
        return err(`Failed to list spaces: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_get_space',
    {
      title: 'Admin: Get Space',
      description: 'Get a specific space by ID (Admin V2 API)',
      inputSchema: {
        space_id: z.number().int().positive().describe('Space ID'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.SPACE(params.space_id),
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to get space', error as Error);
        return err(`Failed to get space: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_space_groups',
    {
      title: 'Admin: List Space Groups',
      description: 'List all space groups (Admin V2 API)',
      inputSchema: {
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.SPACE_GROUPS,
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list space groups', error as Error);
        return err(`Failed to list space groups: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_get_space_group',
    {
      title: 'Admin: Get Space Group',
      description: 'Get a specific space group by ID (Admin V2 API)',
      inputSchema: {
        space_group_id: z.number().int().positive().describe('Space group ID'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.SPACE_GROUP(params.space_group_id),
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to get space group', error as Error);
        return err(`Failed to get space group: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_space_members',
    {
      title: 'Admin: List Space Members',
      description: 'List members of a specific space (Admin V2 API)',
      inputSchema: {
        space_id: z.number().int().positive().describe('Space ID'),
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.SPACE_MEMBERS(params.space_id),
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list space members', error as Error);
        return err(`Failed to list space members: ${formatErrorMessage(error)}`);
      }
    }
  );

  // --- Destructive tools ---

  if (!readOnlyMode) {
    server.registerTool(
      'admin_create_space',
      {
        title: 'Admin: Create Space',
        description: 'Create a new community space (Admin V2 API)',
        inputSchema: {
          name: z.string().min(1).max(255).describe('Space name'),
          slug: z.string().min(1).optional().describe('URL slug'),
          description: z.string().optional().describe('Space description'),
          emoji: z.string().optional().describe('Space emoji'),
          space_type: z.string().optional().describe('Space type (e.g., basic, course, event)'),
          is_private: z.boolean().default(false).describe('Whether the space is private'),
          is_hidden: z.boolean().default(false).describe('Whether the space is hidden'),
          space_group_id: z.number().int().positive().optional().describe('Space group to add this space to'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.SPACES,
            data: params,
          });
          return ok(`Space created successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to create space', error as Error);
          return err(`Failed to create space: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_update_space',
      {
        title: 'Admin: Update Space',
        description: 'Update an existing space (Admin V2 API)',
        inputSchema: {
          space_id: z.number().int().positive().describe('Space ID to update'),
          name: z.string().min(1).max(255).optional().describe('Space name'),
          description: z.string().optional().describe('Space description'),
          emoji: z.string().optional().describe('Space emoji'),
          is_private: z.boolean().optional().describe('Whether the space is private'),
          is_hidden: z.boolean().optional().describe('Whether the space is hidden'),
        },
      },
      async (params) => {
        try {
          const { space_id, ...updateData } = params;
          const data = await adminV2Request({
            method: 'PATCH',
            endpoint: ADMIN_V2_ENDPOINTS.SPACE(space_id),
            data: updateData,
          });
          return ok(`Space updated successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to update space', error as Error);
          return err(`Failed to update space: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_delete_space',
      {
        title: 'Admin: Delete Space',
        description: 'Delete a community space (Admin V2 API)',
        inputSchema: {
          space_id: z.number().int().positive().describe('Space ID to delete'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.SPACE(params.space_id),
          });
          return ok('Space deleted successfully.');
        } catch (error) {
          logger.error('Failed to delete space', error as Error);
          return err(`Failed to delete space: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_create_space_group',
      {
        title: 'Admin: Create Space Group',
        description: 'Create a new space group (Admin V2 API)',
        inputSchema: {
          name: z.string().min(1).max(255).describe('Group name'),
          slug: z.string().min(1).optional().describe('URL slug'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.SPACE_GROUPS,
            data: params,
          });
          return ok(`Space group created successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to create space group', error as Error);
          return err(`Failed to create space group: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_update_space_group',
      {
        title: 'Admin: Update Space Group',
        description: 'Update a space group (Admin V2 API)',
        inputSchema: {
          space_group_id: z.number().int().positive().describe('Space group ID'),
          name: z.string().min(1).max(255).optional().describe('Group name'),
        },
      },
      async (params) => {
        try {
          const { space_group_id, ...updateData } = params;
          const data = await adminV2Request({
            method: 'PATCH',
            endpoint: ADMIN_V2_ENDPOINTS.SPACE_GROUP(space_group_id),
            data: updateData,
          });
          return ok(`Space group updated successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to update space group', error as Error);
          return err(`Failed to update space group: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_delete_space_group',
      {
        title: 'Admin: Delete Space Group',
        description: 'Delete a space group (Admin V2 API)',
        inputSchema: {
          space_group_id: z.number().int().positive().describe('Space group ID to delete'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.SPACE_GROUP(params.space_group_id),
          });
          return ok('Space group deleted successfully.');
        } catch (error) {
          logger.error('Failed to delete space group', error as Error);
          return err(`Failed to delete space group: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_add_space_member',
      {
        title: 'Admin: Add Space Member',
        description: 'Add a member to a space (Admin V2 API)',
        inputSchema: {
          space_id: z.number().int().positive().describe('Space ID'),
          community_member_id: z.number().int().positive().describe('Community member ID to add'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.SPACE_MEMBERS(params.space_id),
            data: { community_member_id: params.community_member_id },
          });
          return ok(`Member added to space successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to add space member', error as Error);
          return err(`Failed to add space member: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_remove_space_member',
      {
        title: 'Admin: Remove Space Member',
        description: 'Remove a member from a space (Admin V2 API)',
        inputSchema: {
          space_id: z.number().int().positive().describe('Space ID'),
          member_id: z.number().int().positive().describe('Member ID to remove'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.SPACE_MEMBER(params.space_id, params.member_id),
          });
          return ok('Member removed from space successfully.');
        } catch (error) {
          logger.error('Failed to remove space member', error as Error);
          return err(`Failed to remove space member: ${formatErrorMessage(error)}`);
        }
      }
    );
  }
}

export function registerAdminSpaceToolsForSession(server: McpServer, readOnlyMode: boolean): void {
  registerAdminSpaceTools(server, readOnlyMode);
}

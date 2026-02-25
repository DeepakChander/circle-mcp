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
  // --- Read tools ---

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
    'admin_list_segments',
    {
      title: 'Admin: List Segments',
      description: 'List all member segments (Admin V2 API)',
      inputSchema: {
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.SEGMENTS,
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list segments', error as Error);
        return err(`Failed to list segments: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_invitations',
    {
      title: 'Admin: List Invitations',
      description: 'List all community invitations (Admin V2 API)',
      inputSchema: {
        status: z.string().optional().describe('Filter by status (pending, accepted, expired)'),
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const queryParams: Record<string, any> = { page: params.page, per_page: params.per_page };
        if (params.status) queryParams.status = params.status;
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.INVITATIONS,
          params: queryParams,
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list invitations', error as Error);
        return err(`Failed to list invitations: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_search',
    {
      title: 'Admin: Search Community',
      description: 'Search across the community (members, posts, spaces, etc.) (Admin V2 API)',
      inputSchema: {
        query: z.string().min(1).describe('Search query'),
        type: z.string().optional().describe('Filter by type (members, posts, spaces)'),
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const queryParams: Record<string, any> = {
          query: params.query,
          page: params.page,
          per_page: params.per_page,
        };
        if (params.type) queryParams.type = params.type;
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.SEARCH,
          params: queryParams,
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to search', error as Error);
        return err(`Failed to search: ${formatErrorMessage(error)}`);
      }
    }
  );

  // --- Destructive tools ---

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
            endpoint: ADMIN_V2_ENDPOINTS.MEMBER_TAGS_FOR_MEMBER(params.member_id),
            data: { member_tag_id: params.tag_id },
          });
          return ok(`Tag assigned to member:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to tag member', error as Error);
          return err(`Failed to tag member: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_untag_member',
      {
        title: 'Admin: Untag Member',
        description: 'Remove a tag from a community member (Admin V2 API)',
        inputSchema: {
          member_id: z.number().int().positive().describe('Member ID'),
          tag_id: z.number().int().positive().describe('Tag ID to remove'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.MEMBER_UNTAG(params.member_id, params.tag_id),
          });
          return ok('Tag removed from member successfully.');
        } catch (error) {
          logger.error('Failed to untag member', error as Error);
          return err(`Failed to untag member: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_create_segment',
      {
        title: 'Admin: Create Segment',
        description: 'Create a new member segment (Admin V2 API)',
        inputSchema: {
          name: z.string().min(1).max(255).describe('Segment name'),
          filters: z.record(z.any()).optional().describe('Segment filter criteria'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.SEGMENTS,
            data: params,
          });
          return ok(`Segment created successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to create segment', error as Error);
          return err(`Failed to create segment: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_update_segment',
      {
        title: 'Admin: Update Segment',
        description: 'Update a member segment (Admin V2 API)',
        inputSchema: {
          segment_id: z.number().int().positive().describe('Segment ID'),
          name: z.string().min(1).max(255).optional().describe('Segment name'),
          filters: z.record(z.any()).optional().describe('Segment filter criteria'),
        },
      },
      async (params) => {
        try {
          const { segment_id, ...updateData } = params;
          const data = await adminV2Request({
            method: 'PATCH',
            endpoint: ADMIN_V2_ENDPOINTS.SEGMENT(segment_id),
            data: updateData,
          });
          return ok(`Segment updated successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to update segment', error as Error);
          return err(`Failed to update segment: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_delete_segment',
      {
        title: 'Admin: Delete Segment',
        description: 'Delete a member segment (Admin V2 API)',
        inputSchema: {
          segment_id: z.number().int().positive().describe('Segment ID to delete'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.SEGMENT(params.segment_id),
          });
          return ok('Segment deleted successfully.');
        } catch (error) {
          logger.error('Failed to delete segment', error as Error);
          return err(`Failed to delete segment: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_create_invitation',
      {
        title: 'Admin: Create Invitation',
        description: 'Send a community invitation to an email address (Admin V2 API)',
        inputSchema: {
          email: z.string().email().describe('Email address to invite'),
          name: z.string().optional().describe('Name of the person being invited'),
          space_ids: z.array(z.number().int().positive()).optional().describe('Space IDs to add the invitee to'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.INVITATIONS,
            data: params,
          });
          return ok(`Invitation sent successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to create invitation', error as Error);
          return err(`Failed to create invitation: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_revoke_invitation',
      {
        title: 'Admin: Revoke Invitation',
        description: 'Revoke a pending community invitation (Admin V2 API)',
        inputSchema: {
          invitation_id: z.number().int().positive().describe('Invitation ID to revoke'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.INVITATION(params.invitation_id),
          });
          return ok('Invitation revoked successfully.');
        } catch (error) {
          logger.error('Failed to revoke invitation', error as Error);
          return err(`Failed to revoke invitation: ${formatErrorMessage(error)}`);
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

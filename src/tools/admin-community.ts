import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { adminV2Request } from '../api/admin-v2-client.js';
import { ADMIN_V2_ENDPOINTS } from '../config/constants.js';
import { Logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/response-handler.js';

const logger = new Logger('AdminCommunityTools');

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function err(text: string) {
  return { content: [{ type: 'text' as const, text }], isError: true };
}

export function registerAdminCommunityTools(server: McpServer, readOnlyMode: boolean): void {
  // --- Read tools ---

  server.registerTool(
    'admin_get_community',
    {
      title: 'Admin: Get Community',
      description: 'Get community information and settings (Admin V2 API)',
      inputSchema: {},
    },
    async () => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.COMMUNITY,
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to get community', error as Error);
        return err(`Failed to get community: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_profile_fields',
    {
      title: 'Admin: List Profile Fields',
      description: 'List all custom profile fields defined in the community (Admin V2 API)',
      inputSchema: {},
    },
    async () => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.PROFILE_FIELDS,
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list profile fields', error as Error);
        return err(`Failed to list profile fields: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_forms',
    {
      title: 'Admin: List Forms',
      description: 'List all forms in the community (Admin V2 API)',
      inputSchema: {
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.FORMS,
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list forms', error as Error);
        return err(`Failed to list forms: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_form_submissions',
    {
      title: 'Admin: List Form Submissions',
      description: 'List submissions for a specific form (Admin V2 API)',
      inputSchema: {
        form_id: z.number().int().positive().describe('Form ID'),
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.FORM_SUBMISSIONS(params.form_id),
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list form submissions', error as Error);
        return err(`Failed to list form submissions: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_summarize_space',
    {
      title: 'Admin: Summarize Space',
      description: 'Get an AI-generated summary of a space\'s content and activity (Admin V2 API)',
      inputSchema: {
        space_id: z.number().int().positive().describe('Space ID to summarize'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'POST',
          endpoint: ADMIN_V2_ENDPOINTS.SPACE_SUMMARIZE(params.space_id),
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to summarize space', error as Error);
        return err(`Failed to summarize space: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_webhooks',
    {
      title: 'Admin: List Webhooks',
      description: 'List all configured webhooks (Admin V2 API)',
      inputSchema: {
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.WEBHOOKS,
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list webhooks', error as Error);
        return err(`Failed to list webhooks: ${formatErrorMessage(error)}`);
      }
    }
  );

  // --- Destructive tools ---

  if (!readOnlyMode) {
    server.registerTool(
      'admin_update_community',
      {
        title: 'Admin: Update Community',
        description: 'Update community settings (Admin V2 API)',
        inputSchema: {
          name: z.string().min(1).max(255).optional().describe('Community name'),
          description: z.string().optional().describe('Community description'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'PATCH',
            endpoint: ADMIN_V2_ENDPOINTS.COMMUNITY,
            data: params,
          });
          return ok(`Community updated successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to update community', error as Error);
          return err(`Failed to update community: ${formatErrorMessage(error)}`);
        }
      }
    );
  }
}

export function registerAdminCommunityToolsForSession(server: McpServer, readOnlyMode: boolean): void {
  registerAdminCommunityTools(server, readOnlyMode);
}

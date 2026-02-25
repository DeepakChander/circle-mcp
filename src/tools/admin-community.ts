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
  // --- Read tools (5) ---

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
      inputSchema: {
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.PROFILE_FIELDS,
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list profile fields', error as Error);
        return err(`Failed to list profile fields: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_all_topics',
    {
      title: 'Admin: List All Topics',
      description: 'List all topics across the community (Admin V2 API)',
      inputSchema: {
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.TOPICS,
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list all topics', error as Error);
        return err(`Failed to list all topics: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_all_course_sections',
    {
      title: 'Admin: List All Course Sections',
      description: 'List all course sections across the community (Admin V2 API)',
      inputSchema: {
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.COURSE_SECTIONS,
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list all course sections', error as Error);
        return err(`Failed to list all course sections: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_all_course_lessons',
    {
      title: 'Admin: List All Course Lessons',
      description: 'List all course lessons across the community (Admin V2 API)',
      inputSchema: {
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.COURSE_LESSONS,
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list all course lessons', error as Error);
        return err(`Failed to list all course lessons: ${formatErrorMessage(error)}`);
      }
    }
  );

  // --- Destructive tools (1) ---

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

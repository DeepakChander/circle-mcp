import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { adminV2Request } from '../api/admin-v2-client.js';
import { ADMIN_V2_ENDPOINTS } from '../config/constants.js';
import { Logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/response-handler.js';

const logger = new Logger('AdminCourseTools');

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function err(text: string) {
  return { content: [{ type: 'text' as const, text }], isError: true };
}

export function registerAdminCourseTools(server: McpServer, readOnlyMode: boolean): void {
  // --- Read tools (4) ---

  server.registerTool(
    'admin_list_courses',
    {
      title: 'Admin: List Courses',
      description: 'List all course spaces in the community (Admin V2 API)',
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
          params: { space_type: 'course', page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list courses', error as Error);
        return err(`Failed to list courses: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_get_course',
    {
      title: 'Admin: Get Course',
      description: 'Get a specific course (space) by ID (Admin V2 API)',
      inputSchema: {
        course_id: z.number().int().positive().describe('Course space ID'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.SPACE(params.course_id),
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to get course', error as Error);
        return err(`Failed to get course: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_course_sections',
    {
      title: 'Admin: List Course Sections',
      description: 'List sections of a course, filtered by space ID (Admin V2 API)',
      inputSchema: {
        space_id: z.number().int().positive().describe('Course space ID'),
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.COURSE_SECTIONS,
          params: { space_id: params.space_id, page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list course sections', error as Error);
        return err(`Failed to list course sections: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_course_lessons',
    {
      title: 'Admin: List Course Lessons',
      description: 'List lessons in a course section (Admin V2 API)',
      inputSchema: {
        course_section_id: z.number().int().positive().describe('Course section ID'),
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.COURSE_LESSONS,
          params: { course_section_id: params.course_section_id, page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list course lessons', error as Error);
        return err(`Failed to list course lessons: ${formatErrorMessage(error)}`);
      }
    }
  );

  // --- Destructive tools (7) ---

  if (!readOnlyMode) {
    server.registerTool(
      'admin_create_course_section',
      {
        title: 'Admin: Create Course Section',
        description: 'Create a new section in a course (Admin V2 API)',
        inputSchema: {
          space_id: z.number().int().positive().describe('Course space ID'),
          name: z.string().min(1).max(255).describe('Section name'),
          position: z.number().int().nonnegative().optional().describe('Position/order of the section'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.COURSE_SECTIONS,
            data: params,
          });
          return ok(`Course section created successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to create course section', error as Error);
          return err(`Failed to create course section: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_update_course_section',
      {
        title: 'Admin: Update Course Section',
        description: 'Update a course section (Admin V2 API)',
        inputSchema: {
          section_id: z.number().int().positive().describe('Section ID to update'),
          name: z.string().min(1).max(255).optional().describe('Section name'),
          position: z.number().int().nonnegative().optional().describe('Position/order'),
        },
      },
      async (params) => {
        try {
          const { section_id, ...updateData } = params;
          const data = await adminV2Request({
            method: 'PATCH',
            endpoint: ADMIN_V2_ENDPOINTS.COURSE_SECTION(section_id),
            data: updateData,
          });
          return ok(`Course section updated successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to update course section', error as Error);
          return err(`Failed to update course section: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_delete_course_section',
      {
        title: 'Admin: Delete Course Section',
        description: 'Delete a course section (Admin V2 API)',
        inputSchema: {
          section_id: z.number().int().positive().describe('Section ID to delete'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.COURSE_SECTION(params.section_id),
          });
          return ok('Course section deleted successfully.');
        } catch (error) {
          logger.error('Failed to delete course section', error as Error);
          return err(`Failed to delete course section: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_create_course_lesson',
      {
        title: 'Admin: Create Course Lesson',
        description: 'Create a new lesson in a course section (Admin V2 API)',
        inputSchema: {
          course_section_id: z.number().int().positive().describe('Course section ID'),
          name: z.string().min(1).max(255).describe('Lesson name'),
          position: z.number().int().nonnegative().optional().describe('Position/order'),
          lesson_type: z.string().optional().describe('Lesson type'),
          published: z.boolean().default(false).describe('Whether the lesson is published'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.COURSE_LESSONS,
            data: params,
          });
          return ok(`Course lesson created successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to create course lesson', error as Error);
          return err(`Failed to create course lesson: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_update_course_lesson',
      {
        title: 'Admin: Update Course Lesson',
        description: 'Update a course lesson (Admin V2 API)',
        inputSchema: {
          lesson_id: z.number().int().positive().describe('Lesson ID to update'),
          name: z.string().min(1).max(255).optional().describe('Lesson name'),
          position: z.number().int().nonnegative().optional().describe('Position/order'),
          published: z.boolean().optional().describe('Whether the lesson is published'),
        },
      },
      async (params) => {
        try {
          const { lesson_id, ...updateData } = params;
          const data = await adminV2Request({
            method: 'PATCH',
            endpoint: ADMIN_V2_ENDPOINTS.COURSE_LESSON(lesson_id),
            data: updateData,
          });
          return ok(`Course lesson updated successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to update course lesson', error as Error);
          return err(`Failed to update course lesson: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_delete_course_lesson',
      {
        title: 'Admin: Delete Course Lesson',
        description: 'Delete a course lesson (Admin V2 API)',
        inputSchema: {
          lesson_id: z.number().int().positive().describe('Lesson ID to delete'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.COURSE_LESSON(params.lesson_id),
          });
          return ok('Course lesson deleted successfully.');
        } catch (error) {
          logger.error('Failed to delete course lesson', error as Error);
          return err(`Failed to delete course lesson: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_complete_lesson',
      {
        title: 'Admin: Mark Lesson Complete',
        description: 'Mark a lesson as complete for a member (Admin V2 API)',
        inputSchema: {
          lesson_id: z.number().int().positive().describe('Lesson ID'),
          community_member_id: z.number().int().positive().describe('Member ID'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.LESSON_PROGRESS(params.lesson_id),
            data: { community_member_id: params.community_member_id },
          });
          return ok(`Lesson marked as complete:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to mark lesson complete', error as Error);
          return err(`Failed to mark lesson complete: ${formatErrorMessage(error)}`);
        }
      }
    );
  }
}

export function registerAdminCourseToolsForSession(server: McpServer, readOnlyMode: boolean): void {
  registerAdminCourseTools(server, readOnlyMode);
}

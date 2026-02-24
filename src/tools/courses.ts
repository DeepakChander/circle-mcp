import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CircleAPIClient } from '../api/client.js';
import type { IntegratedAuthManager } from '../auth/integrated-auth-manager.js';
import { endpoints } from '../api/endpoints.js';
import { Logger } from '../utils/logger.js';
import type { CircleCourse, PaginatedResponse } from '../types/index.js';
import { withAuthentication, withSessionAuth } from './auth-wrapper.js';

const logger = new Logger('CourseTools');

function createGetMyCoursesHandler(apiClient: CircleAPIClient) {
  return async (params: any) => {
    try {
      const email = params.authenticatedEmail;
      const response = await apiClient.get<PaginatedResponse<CircleCourse>>(
        endpoints.getCourses(params),
        email
      );

      const courseSummary = response.records.map(course => ({
        id: course.id,
        name: course.name,
        progress: `${course.completed_lessons_count}/${course.lessons_count} lessons`,
        completion: course.progress ? `${course.progress}%` : '0%',
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            total_courses: response.count,
            page: response.page,
            courses: courseSummary,
          }, null, 2),
        }],
      };
    } catch (error) {
      logger.error('Failed to get courses', error as Error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      if (errorMsg.includes('404')) {
        return {
          content: [{
            type: 'text',
            text: `Courses feature is not available.\n\nThis community may not have courses enabled, or the courses API endpoint is not accessible with your current permissions.\n\nContact the community administrator if you believe this is an error.`,
          }],
        };
      }

      return {
        content: [{ type: 'text', text: `Error: ${errorMsg}` }],
        isError: true,
      };
    }
  };
}

function createGetCourseDetailsHandler(apiClient: CircleAPIClient) {
  return async (params: any) => {
    try {
      const email = params.authenticatedEmail;
      const course = await apiClient.get<CircleCourse>(
        endpoints.getCourse(params.course_id),
        email
      );

      return {
        content: [{ type: 'text', text: JSON.stringify(course, null, 2) }],
      };
    } catch (error) {
      logger.error('Failed to get course details', error as Error);
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true,
      };
    }
  };
}

export function registerCourseToolsForSession(
  server: McpServer,
  apiClient: CircleAPIClient,
  email: string
): void {
  server.registerTool(
    'get_my_courses',
    {
      title: 'Get My Courses',
      description: 'List all courses you are enrolled in.',
      inputSchema: {
        page: z.number().int().positive().default(1),
        per_page: z.number().int().positive().max(100).default(20),
      },
    },
    withSessionAuth(email, createGetMyCoursesHandler(apiClient))
  );

  server.registerTool(
    'get_course_details',
    {
      title: 'Get Course Details',
      description: 'Get detailed information about a specific course.',
      inputSchema: {
        course_id: z.number().int().positive(),
      },
    },
    withSessionAuth(email, createGetCourseDetailsHandler(apiClient))
  );
}

export function registerCourseTools(
  server: McpServer,
  apiClient: CircleAPIClient,
  authManager: IntegratedAuthManager
) {
  // Get my courses
  server.registerTool(
    'get_my_courses',
    {
      title: 'Get My Courses',
      description: 'List all courses you are enrolled in. Provide your email if not authenticated.',
      inputSchema: {
        email: z.string().email().optional(),
        page: z.number().int().positive().default(1),
        per_page: z.number().int().positive().max(100).default(20),
      },
    },
        withAuthentication(authManager, async (params) => {
          try {
            const email = (params as any).authenticatedEmail;
        const response = await apiClient.get<PaginatedResponse<CircleCourse>>(
          endpoints.getCourses(params),
          email
        );

        const courseSummary = response.records.map(course => ({
          id: course.id,
          name: course.name,
          progress: `${course.completed_lessons_count}/${course.lessons_count} lessons`,
          completion: course.progress ? `${course.progress}%` : '0%',
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total_courses: response.count,
              page: response.page,
              courses: courseSummary,
            }, null, 2),
          }],
        };
      } catch (error) {
        logger.error('Failed to get courses', error as Error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        // Check if it's a 404 error
        if (errorMsg.includes('404')) {
          return {
            content: [{
              type: 'text',
              text: `⚠️  Courses feature is not available.\n\nThis community may not have courses enabled, or the courses API endpoint is not accessible with your current permissions.\n\nContact the community administrator if you believe this is an error.`,
            }],
          };
        }

        return {
          content: [{
            type: 'text',
            text: `Error: ${errorMsg}`,
          }],
          isError: true,
        };
      }
    })
  );

  // Get course details
  server.registerTool(
    'get_course_details',
    {
      title: 'Get Course Details',
      description: 'Get detailed information about a specific course. Provide your email if not authenticated.',
      inputSchema: {
        email: z.string().email().optional(),
        course_id: z.number().int().positive(),
      },
    },
        withAuthentication(authManager, async (params) => {
          try {
            const email = (params as any).authenticatedEmail;
        const course = await apiClient.get<CircleCourse>(
          endpoints.getCourse(params.course_id),
          email
        );

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(course, null, 2),
          }],
        };
      } catch (error) {
        logger.error('Failed to get course details', error as Error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }],
          isError: true,
        };
      }
    })
  );
}
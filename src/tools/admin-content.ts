import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { adminV2Request } from '../api/admin-v2-client.js';
import { ADMIN_V2_ENDPOINTS } from '../config/constants.js';
import { Logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/response-handler.js';

const logger = new Logger('AdminContentTools');

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function err(text: string) {
  return { content: [{ type: 'text' as const, text }], isError: true };
}

export function registerAdminContentTools(server: McpServer, readOnlyMode: boolean): void {
  // --- Read tools (6) ---

  server.registerTool(
    'admin_list_posts',
    {
      title: 'Admin: List Posts',
      description: 'List posts with optional space filter (Admin V2 API)',
      inputSchema: {
        space_id: z.number().int().positive().optional().describe('Filter by space ID'),
        status: z.string().optional().describe('Filter by status (published, draft)'),
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const queryParams: Record<string, any> = { page: params.page, per_page: params.per_page };
        if (params.space_id) queryParams.space_id = params.space_id;
        if (params.status) queryParams.status = params.status;
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.POSTS,
          params: queryParams,
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list posts', error as Error);
        return err(`Failed to list posts: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_get_post',
    {
      title: 'Admin: Get Post',
      description: 'Get a specific post by ID (Admin V2 API)',
      inputSchema: {
        post_id: z.number().int().positive().describe('Post ID'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.POST(params.post_id),
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to get post', error as Error);
        return err(`Failed to get post: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_comments',
    {
      title: 'Admin: List Comments',
      description: 'List comments, optionally filtered by post ID (Admin V2 API)',
      inputSchema: {
        post_id: z.number().int().positive().optional().describe('Filter by post ID'),
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const queryParams: Record<string, any> = { page: params.page, per_page: params.per_page };
        if (params.post_id) queryParams.post_id = params.post_id;
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.COMMENTS,
          params: queryParams,
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list comments', error as Error);
        return err(`Failed to list comments: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_get_comment',
    {
      title: 'Admin: Get Comment',
      description: 'Get a specific comment by ID (Admin V2 API)',
      inputSchema: {
        comment_id: z.number().int().positive().describe('Comment ID'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.COMMENT(params.comment_id),
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to get comment', error as Error);
        return err(`Failed to get comment: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_topics',
    {
      title: 'Admin: List Topics',
      description: 'List topics, optionally filtered by space ID (Admin V2 API)',
      inputSchema: {
        space_id: z.number().int().positive().optional().describe('Filter by space ID'),
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const queryParams: Record<string, any> = { page: params.page, per_page: params.per_page };
        if (params.space_id) queryParams.space_id = params.space_id;
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.TOPICS,
          params: queryParams,
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list topics', error as Error);
        return err(`Failed to list topics: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_all_comments',
    {
      title: 'Admin: List All Comments',
      description: 'List all comments across the community (Admin V2 API)',
      inputSchema: {
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.COMMENTS,
          params: { page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list all comments', error as Error);
        return err(`Failed to list all comments: ${formatErrorMessage(error)}`);
      }
    }
  );

  // --- Destructive tools (10) ---

  if (!readOnlyMode) {
    server.registerTool(
      'admin_create_post',
      {
        title: 'Admin: Create Post',
        description: 'Create a new post in a space (Admin V2 API)',
        inputSchema: {
          space_id: z.number().int().positive().describe('Space ID to post in'),
          name: z.string().min(1).max(255).describe('Post title'),
          body: z.string().min(1).describe('Post body content (HTML or plain text)'),
          status: z.enum(['published', 'draft']).default('published').describe('Post status'),
          is_pinned: z.boolean().default(false).describe('Pin the post'),
          is_comments_enabled: z.boolean().default(true).describe('Enable comments'),
          community_member_id: z.number().int().positive().optional().describe('Author member ID (defaults to admin)'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.POSTS,
            data: params,
          });
          return ok(`Post created successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to create post', error as Error);
          return err(`Failed to create post: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_update_post',
      {
        title: 'Admin: Update Post',
        description: 'Update an existing post (Admin V2 API)',
        inputSchema: {
          post_id: z.number().int().positive().describe('Post ID to update'),
          name: z.string().min(1).max(255).optional().describe('Post title'),
          body: z.string().optional().describe('Post body content'),
          status: z.enum(['published', 'draft']).optional().describe('Post status'),
          is_pinned: z.boolean().optional().describe('Pin the post'),
          is_comments_enabled: z.boolean().optional().describe('Enable comments'),
        },
      },
      async (params) => {
        try {
          const { post_id, ...updateData } = params;
          const data = await adminV2Request({
            method: 'PATCH',
            endpoint: ADMIN_V2_ENDPOINTS.POST(post_id),
            data: updateData,
          });
          return ok(`Post updated successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to update post', error as Error);
          return err(`Failed to update post: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_delete_post',
      {
        title: 'Admin: Delete Post',
        description: 'Delete a post (Admin V2 API)',
        inputSchema: {
          post_id: z.number().int().positive().describe('Post ID to delete'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.POST(params.post_id),
          });
          return ok('Post deleted successfully.');
        } catch (error) {
          logger.error('Failed to delete post', error as Error);
          return err(`Failed to delete post: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_create_comment',
      {
        title: 'Admin: Create Comment',
        description: 'Create a comment on a post (Admin V2 API)',
        inputSchema: {
          post_id: z.number().int().positive().describe('Post ID to comment on'),
          body: z.string().min(1).describe('Comment body'),
          community_member_id: z.number().int().positive().optional().describe('Author member ID'),
          parent_comment_id: z.number().int().positive().optional().describe('Parent comment ID for replies'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.COMMENTS,
            data: params,
          });
          return ok(`Comment created successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to create comment', error as Error);
          return err(`Failed to create comment: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_update_comment',
      {
        title: 'Admin: Update Comment',
        description: 'Update an existing comment (Admin V2 API)',
        inputSchema: {
          comment_id: z.number().int().positive().describe('Comment ID to update'),
          body: z.string().min(1).describe('Updated comment body'),
        },
      },
      async (params) => {
        try {
          const { comment_id, ...updateData } = params;
          const data = await adminV2Request({
            method: 'PATCH',
            endpoint: ADMIN_V2_ENDPOINTS.COMMENT(comment_id),
            data: updateData,
          });
          return ok(`Comment updated successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to update comment', error as Error);
          return err(`Failed to update comment: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_delete_comment',
      {
        title: 'Admin: Delete Comment',
        description: 'Delete a comment (Admin V2 API)',
        inputSchema: {
          comment_id: z.number().int().positive().describe('Comment ID to delete'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.COMMENT(params.comment_id),
          });
          return ok('Comment deleted successfully.');
        } catch (error) {
          logger.error('Failed to delete comment', error as Error);
          return err(`Failed to delete comment: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_create_topic',
      {
        title: 'Admin: Create Topic',
        description: 'Create a new topic (Admin V2 API)',
        inputSchema: {
          space_id: z.number().int().positive().describe('Space ID'),
          name: z.string().min(1).max(255).describe('Topic name'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.TOPICS,
            data: { space_id: params.space_id, name: params.name },
          });
          return ok(`Topic created successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to create topic', error as Error);
          return err(`Failed to create topic: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_update_topic',
      {
        title: 'Admin: Update Topic',
        description: 'Update a topic (Admin V2 API)',
        inputSchema: {
          topic_id: z.number().int().positive().describe('Topic ID'),
          name: z.string().min(1).max(255).describe('Updated topic name'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'PATCH',
            endpoint: ADMIN_V2_ENDPOINTS.TOPIC(params.topic_id),
            data: { name: params.name },
          });
          return ok(`Topic updated successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to update topic', error as Error);
          return err(`Failed to update topic: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_delete_topic',
      {
        title: 'Admin: Delete Topic',
        description: 'Delete a topic (Admin V2 API)',
        inputSchema: {
          topic_id: z.number().int().positive().describe('Topic ID to delete'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.TOPIC(params.topic_id),
          });
          return ok('Topic deleted successfully.');
        } catch (error) {
          logger.error('Failed to delete topic', error as Error);
          return err(`Failed to delete topic: ${formatErrorMessage(error)}`);
        }
      }
    );
  }
}

export function registerAdminContentToolsForSession(server: McpServer, readOnlyMode: boolean): void {
  registerAdminContentTools(server, readOnlyMode);
}

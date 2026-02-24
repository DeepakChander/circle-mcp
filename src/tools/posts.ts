import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CircleAPIClient } from '../api/client.js';
import type { IntegratedAuthManager } from '../auth/integrated-auth-manager.js';
import { endpoints } from '../api/endpoints.js';
import { Logger } from '../utils/logger.js';
import type { CirclePost } from '../types/index.js';
import { withAuthentication, withSessionAuth } from './auth-wrapper.js';
import { extractArrayFromResponse, formatErrorMessage } from '../utils/response-handler.js';

const logger = new Logger('PostTools');

function createGetPostsHandler(apiClient: CircleAPIClient) {
  return async (params: any) => {
    try {
      const email = params.authenticatedEmail;
      const response = await apiClient.get<any>(endpoints.getPosts(params), email);
      const postsArray = extractArrayFromResponse<CirclePost>(response);

      if (postsArray.length === 0) {
        return { content: [{ type: 'text', text: 'No posts found. The community may not have any posts yet.' }] };
      }

      const posts = postsArray.map(post => ({
        id: post.id, title: post.name, author: post.author?.name || 'Unknown',
        space: post.space_name || 'Unknown', likes: post.likes_count || 0,
        comments: post.comments_count || 0, created: post.created_at,
      }));

      return { content: [{ type: 'text', text: JSON.stringify({ total: posts.length, posts }, null, 2) }] };
    } catch (error) {
      logger.error('Failed to get posts', error as Error);
      return { content: [{ type: 'text', text: `Error: ${formatErrorMessage(error)}` }], isError: true };
    }
  };
}

function createCreatePostHandler(apiClient: CircleAPIClient) {
  return async (params: any) => {
    try {
      const email = params.authenticatedEmail;
      const post = await apiClient.post<CirclePost>(endpoints.createPost(), email, params);
      return { content: [{ type: 'text', text: `Post created successfully!\nTitle: ${post.name}\nURL: ${post.url}` }] };
    } catch (error) {
      logger.error('Failed to create post', error as Error);
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
    }
  };
}

function createUpdatePostHandler(apiClient: CircleAPIClient) {
  return async (params: any) => {
    try {
      const email = params.authenticatedEmail;
      const { post_id, ...updateData } = params;
      await apiClient.put(endpoints.updatePost(post_id), email, updateData);
      return { content: [{ type: 'text', text: 'Post updated successfully' }] };
    } catch (error) {
      logger.error('Failed to update post', error as Error);
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
    }
  };
}

function createLikePostHandler(apiClient: CircleAPIClient) {
  return async (params: any) => {
    try {
      const email = params.authenticatedEmail;
      await apiClient.post(endpoints.likePost(params.post_id), email, {});
      return { content: [{ type: 'text', text: 'Post liked successfully' }] };
    } catch (error) {
      logger.error('Failed to like post', error as Error);
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
    }
  };
}

function createDeletePostHandler(apiClient: CircleAPIClient) {
  return async (params: any) => {
    try {
      const email = params.authenticatedEmail;
      await apiClient.delete(endpoints.deletePost(params.post_id), email);
      return { content: [{ type: 'text', text: 'Post deleted successfully' }] };
    } catch (error) {
      logger.error('Failed to delete post', error as Error);
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
    }
  };
}

export function registerPostToolsForSession(
  server: McpServer,
  apiClient: CircleAPIClient,
  email: string,
  readOnlyMode: boolean
): void {
  server.registerTool('get_posts', {
    title: 'Get Posts', description: 'List posts from a space or all spaces',
    inputSchema: {
      space_id: z.number().int().positive().optional(),
      page: z.number().int().positive().default(1),
      per_page: z.number().int().positive().max(100).default(20),
    },
  }, withSessionAuth(email, createGetPostsHandler(apiClient)));

  if (!readOnlyMode) {
    server.registerTool('create_post', {
      title: 'Create Post', description: 'Create a new post in a space',
      inputSchema: {
        space_id: z.number().int().positive(),
        name: z.string().min(1).max(255),
        body: z.string().min(1),
        status: z.enum(['draft', 'published']).default('published'),
      },
    }, withSessionAuth(email, createCreatePostHandler(apiClient)));

    server.registerTool('update_post', {
      title: 'Update Post', description: 'Update an existing post (only your own posts)',
      inputSchema: {
        post_id: z.number().int().positive(),
        name: z.string().min(1).max(255).optional(),
        body: z.string().min(1).optional(),
        status: z.enum(['draft', 'published']).optional(),
      },
    }, withSessionAuth(email, createUpdatePostHandler(apiClient)));

    server.registerTool('like_post', {
      title: 'Like Post', description: 'Like or unlike a post',
      inputSchema: { post_id: z.number().int().positive() },
    }, withSessionAuth(email, createLikePostHandler(apiClient)));

    server.registerTool('delete_post', {
      title: 'Delete Post', description: 'Delete your own post',
      inputSchema: { post_id: z.number().int().positive() },
    }, withSessionAuth(email, createDeletePostHandler(apiClient)));
  }
}

export function registerPostTools(
  server: McpServer,
  apiClient: CircleAPIClient,
  authManager: IntegratedAuthManager,
  readOnlyMode: boolean
) {
  // Get posts
  server.registerTool(
    'get_posts',
    {
      title: 'Get Posts',
      description: 'List posts from a space or all spaces',
      inputSchema: { // FIXED
        space_id: z.number().int().positive().optional(),
        page: z.number().int().positive().default(1),
        per_page: z.number().int().positive().max(100).default(20),
      },
    },
    withAuthentication(authManager, async (params) => {
      try {
        const email = (params as any).authenticatedEmail;
        const response = await apiClient.get<any>(
          endpoints.getPosts(params),
          email
        );

        // Robustly extract posts array from response
        const postsArray = extractArrayFromResponse<CirclePost>(response);

        if (postsArray.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No posts found. The community may not have any posts yet.',
            }],
          };
        }

        const posts = postsArray.map(post => ({
          id: post.id,
          title: post.name,
          author: post.author?.name || 'Unknown',
          space: post.space_name || 'Unknown',
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          created: post.created_at,
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total: posts.length,
              posts,
            }, null, 2),
          }],
        };
      } catch (error) {
        logger.error('Failed to get posts', error as Error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${formatErrorMessage(error)}`,
          }],
          isError: true,
        };
      }
    })
  );

  // Create post (unless read-only)
  if (!readOnlyMode) {
    server.registerTool(
      'create_post',
      {
        title: 'Create Post',
        description: 'Create a new post in a space',
        inputSchema: { // FIXED
          space_id: z.number().int().positive(),
          name: z.string().min(1).max(255),
          body: z.string().min(1),
          status: z.enum(['draft', 'published']).default('published'),
        },
      },
      async (params) => {
        try {
          const email = (params as any).authenticatedEmail;
          const post = await apiClient.post<CirclePost>(
            endpoints.createPost(),
            email,
            params
          );

          return {
            content: [{
              type: 'text',
              text: `✅ Post created successfully!\nTitle: ${post.name}\nURL: ${post.url}`,
            }],
          };
        } catch (error) {
          logger.error('Failed to create post', error as Error);
          return {
            content: [{
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );

    // Update post
    server.registerTool(
      'update_post',
      {
        title: 'Update Post',
        description: 'Update an existing post (only your own posts)',
        inputSchema: { // FIXED
          post_id: z.number().int().positive(),
          name: z.string().min(1).max(255).optional(),
          body: z.string().min(1).optional(),
          status: z.enum(['draft', 'published']).optional(),
        },
      },
      async (params) => {
        try {
          const email = (params as any).authenticatedEmail;
          const { post_id, ...updateData } = params;
          
          await apiClient.put(
            endpoints.updatePost(post_id),
            email,
            updateData
          );

          return {
            content: [{
              type: 'text',
              text: '✅ Post updated successfully',
            }],
          };
        } catch (error) {
          logger.error('Failed to update post', error as Error);
          return {
            content: [{
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );

    // Like post
    server.registerTool(
      'like_post',
      {
        title: 'Like Post',
        description: 'Like or unlike a post',
        inputSchema: { // FIXED
          post_id: z.number().int().positive(),
        },
      },
      withAuthentication(authManager, async (params) => {
        try {
          const email = (params as any).authenticatedEmail;
          await apiClient.post(
            endpoints.likePost(params.post_id),
            email,
            {}
          );

          return {
            content: [{
              type: 'text',
              text: '✅ Post liked successfully',
            }],
          };
        } catch (error) {
          logger.error('Failed to like post', error as Error);
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

    // Delete post
    server.registerTool(
      'delete_post',
      {
        title: 'Delete Post',
        description: 'Delete your own post',
        inputSchema: {
          post_id: z.number().int().positive(),
        },
      },
      withAuthentication(authManager, async (params) => {
        try {
          const email = (params as any).authenticatedEmail;
          await apiClient.delete(
            endpoints.deletePost(params.post_id),
            email
          );

          return {
            content: [{
              type: 'text',
              text: '✅ Post deleted successfully',
            }],
          };
        } catch (error) {
          logger.error('Failed to delete post', error as Error);
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
}
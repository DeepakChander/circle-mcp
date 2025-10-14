import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CircleAPIClient } from '../api/client.js';
import type { IntegratedAuthManager } from '../auth/integrated-auth-manager.js';
import { endpoints } from '../api/endpoints.js';
import { Logger } from '../utils/logger.js';
import { withAuthentication } from './auth-wrapper.js';
import { extractArrayFromResponse, formatErrorMessage } from '../utils/response-handler.js';

const logger = new Logger('CommentTools');

export function registerCommentTools(
  server: McpServer,
  apiClient: CircleAPIClient,
  authManager: IntegratedAuthManager,
  readOnlyMode: boolean
) {
  // Get comments for a post
  server.registerTool(
    'get_comments',
    {
      title: 'Get Comments',
      description: 'Get all comments for a specific post',
      inputSchema: {
        post_id: z.number().int().positive(),
      },
    },
    withAuthentication(authManager, async (params) => {
      try {
        const email = (params as any).authenticatedEmail;
        const response = await apiClient.get<any>(
          endpoints.getComments(params.post_id),
          email
        );

        const commentsArray = extractArrayFromResponse<any>(response);

        if (commentsArray.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No comments found on this post.',
            }],
          };
        }

        const comments = commentsArray.map(comment => ({
          id: comment.id,
          body: comment.body,
          author: comment.author?.name || 'Unknown',
          created_at: comment.created_at,
          likes_count: comment.likes_count || 0,
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              post_id: params.post_id,
              total: comments.length,
              comments,
            }, null, 2),
          }],
        };
      } catch (error) {
        logger.error('Failed to get comments', error as Error);
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

  if (!readOnlyMode) {
    // Add comment
    server.registerTool(
      'add_comment',
      {
        title: 'Add Comment',
        description: 'Add a comment to a post',
        inputSchema: {
          post_id: z.number().int().positive(),
          body: z.string().min(1),
        },
      },
      withAuthentication(authManager, async (params) => {
        try {
          const email = (params as any).authenticatedEmail;
          const comment = await apiClient.post<any>(
            endpoints.createComment(params.post_id),
            email,
            { body: params.body }
          );

          return {
            content: [{
              type: 'text',
              text: `✅ Comment added successfully!\nComment ID: ${comment.id}`,
            }],
          };
        } catch (error) {
          logger.error('Failed to add comment', error as Error);
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

    // Delete comment
    server.registerTool(
      'delete_comment',
      {
        title: 'Delete Comment',
        description: 'Delete your own comment',
        inputSchema: {
          comment_id: z.number().int().positive(),
        },
      },
      withAuthentication(authManager, async (params) => {
        try {
          const email = (params as any).authenticatedEmail;
          await apiClient.delete(
            endpoints.deleteComment(params.comment_id),
            email
          );

          return {
            content: [{
              type: 'text',
              text: '✅ Comment deleted successfully',
            }],
          };
        } catch (error) {
          logger.error('Failed to delete comment', error as Error);
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

    // Like comment
    server.registerTool(
      'like_comment',
      {
        title: 'Like Comment',
        description: 'Like or unlike a comment',
        inputSchema: {
          comment_id: z.number().int().positive(),
        },
      },
      withAuthentication(authManager, async (params) => {
        try {
          const email = (params as any).authenticatedEmail;
          await apiClient.post(
            endpoints.likeComment(params.comment_id),
            email,
            {}
          );

          return {
            content: [{
              type: 'text',
              text: '✅ Comment liked successfully',
            }],
          };
        } catch (error) {
          logger.error('Failed to like comment', error as Error);
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
  }
}
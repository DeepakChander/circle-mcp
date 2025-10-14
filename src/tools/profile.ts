import { z } from 'zod';
import axios from 'axios';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CircleAPIClient } from '../api/client.js';
import type { IntegratedAuthManager } from '../auth/integrated-auth-manager.js';
import { endpoints } from '../api/endpoints.js';
import { Logger } from '../utils/logger.js';
import { withAuthentication } from './auth-wrapper.js';
import { formatErrorMessage } from '../utils/response-handler.js';
import { config } from '../config/config.js';

const logger = new Logger('ProfileTools');

export function registerProfileTools(
  server: McpServer,
  apiClient: CircleAPIClient,
  authManager: IntegratedAuthManager
) {
  // Get my profile
  server.registerTool(
    'get_my_profile',
    {
      title: 'Get My Profile',
      description: 'Retrieve your Circle community profile information with full details.',
      inputSchema: {
        email: z.string().email().optional(),
      },
    },
    withAuthentication(authManager, async (params) => {
      try {
        const email = (params as any).authenticatedEmail;

        logger.info('Fetching profile with Admin API v2', { email });

        // Use Admin API v2 to get CORRECT profile data
        if (!config.adminV2Token) {
          logger.warn('Admin V2 token not configured, trying fallback method');
          return {
            content: [{
              type: 'text',
              text: `⚠️ Admin API v2 token not configured.\n\nTo get full profile data, please add CIRCLE_ADMIN_V2_TOKEN to your .env file.\n\nCreate token at: ${config.communityUrl}/admin/settings/developers`,
            }],
          };
        }

        logger.debug('Fetching community members from Admin API v2');

        // Helper function to fetch all members across pages
        async function fetchMemberByEmail(targetEmail: string, page = 1, maxPages = 10): Promise<any> {
          try {
            const response = await axios.get(
              `${config.headlessBaseUrl}/api/admin/v2/community_members`,
              {
                params: {
                  page,
                  per_page: 100
                },
                headers: {
                  'Authorization': `Bearer ${config.adminV2Token}`,
                  'Content-Type': 'application/json',
                },
                timeout: 15000,
              }
            );

            const members = response.data?.records || response.data?.data || [];

            // Search for the member in this batch
            const member = members.find((m: any) =>
              m.email === targetEmail ||
              m.user_email === targetEmail ||
              (m.user && m.user.email === targetEmail)
            );

            if (member) {
              return member;
            }

            // Check if there are more pages
            const hasNextPage = response.data?.has_next_page || response.data?.meta?.has_next_page;

            if (hasNextPage && page < maxPages) {
              logger.debug(`Member not found on page ${page}, checking next page`);
              return fetchMemberByEmail(targetEmail, page + 1, maxPages);
            }

            return null;
          } catch (error) {
            logger.error('Failed to fetch members from Admin API v2', error as Error);
            throw error;
          }
        }

        const profile = await fetchMemberByEmail(email);

        if (!profile) {
          return {
            content: [{
              type: 'text',
              text: `No profile found for ${email}.\n\nThis email may not be a member of this Circle community.`,
            }],
          };
        }

        logger.info('Found profile via Admin API v2', { email, name: profile.name });

        // Extract flattened profile fields
        const flattenedFields = profile.flattened_profile_fields || {};

        // Format profile data with CORRECT information from Admin API
        const formattedProfile: any = {
          id: profile.id,
          name: profile.name || 'Not set',
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          email: profile.email || email,
          headline: flattenedFields.headline || profile.headline || '',
          bio: flattenedFields.bio || profile.bio || '',
          location: flattenedFields.location || '',
          website: flattenedFields.website || '',
          avatar_url: profile.avatar_url || null,
          profile_url: profile.profile_url || null,
          member_since: profile.created_at || 'Unknown',
          last_seen_at: profile.last_seen_at || null,
          active: profile.active || false,
          posts_count: profile.posts_count || 0,
          comments_count: profile.comments_count || 0,
        };

        // Add custom profile fields
        if (Object.keys(flattenedFields).length > 0) {
          formattedProfile.custom_fields = flattenedFields;
        }

        // Add gamification stats if available
        if (profile.gamification_stats) {
          formattedProfile.gamification = {
            total_points: profile.gamification_stats.total_points,
            current_level: profile.gamification_stats.current_level,
            level_name: profile.gamification_stats.current_level_name,
            points_to_next_level: profile.gamification_stats.points_to_next_level,
          };
        }

        // Add activity score if available
        if (profile.activity_score) {
          formattedProfile.activity = profile.activity_score;
        }

        // Add member tags if available
        if (profile.member_tags && profile.member_tags.length > 0) {
          formattedProfile.tags = profile.member_tags.map((tag: any) => tag.name);
        }

        return {
          content: [{
            type: 'text',
            text: `👤 Your Circle Profile:\n\n${JSON.stringify(formattedProfile, null, 2)}`,
          }],
        };

      } catch (error) {
        logger.error('Failed to get profile', error as Error);

        // Check for specific error types
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            return {
              content: [{
                type: 'text',
                text: `Authentication failed. Please ensure your CIRCLE_ADMIN_V2_TOKEN is valid.\n\nCreate a new token at: ${config.communityUrl}/admin/settings/developers`,
              }],
              isError: true,
            };
          }
          if (error.response?.status === 404) {
            return {
              content: [{
                type: 'text',
                text: `Admin API v2 endpoint not found. Please verify your Circle configuration.`,
              }],
              isError: true,
            };
          }
        }

        return {
          content: [{
            type: 'text',
            text: `Error retrieving profile: ${formatErrorMessage(error)}`,
          }],
          isError: true,
        };
      }
    })
  );

  // Update my profile
  server.registerTool(
    'update_my_profile',
    {
      title: 'Update My Profile',
      description: 'Update your Circle profile information including name, bio, location, headline, and custom fields',
      inputSchema: {
        email: z.string().email().optional(),
        name: z.string().min(1).max(100).optional(),
        first_name: z.string().min(1).max(100).optional(),
        last_name: z.string().min(1).max(100).optional(),
        bio: z.string().max(2000).optional(),
        location: z.string().max(200).optional(),
        headline: z.string().max(200).optional(),
        website: z.string().url().optional(),
        // Custom fields - add any community-specific fields here
        custom_fields: z.record(z.any()).optional(),
      },
    },
    withAuthentication(authManager, async (params: any) => {
      try {
        const userEmail = params.authenticatedEmail;
        const { email, authenticatedEmail, custom_fields, ...updateData } = params;

        // Check if Admin V2 token is available for full profile update
        if (config.adminV2Token) {
          logger.info('Updating profile via Admin API v2', { email: userEmail });

          // First, get the user's ID from Admin API
          async function fetchMemberByEmail(targetEmail: string, page = 1): Promise<any> {
            const response = await axios.get(
              `${config.headlessBaseUrl}/api/admin/v2/community_members`,
              {
                params: { page, per_page: 100 },
                headers: {
                  'Authorization': `Bearer ${config.adminV2Token}`,
                  'Content-Type': 'application/json',
                },
                timeout: 15000,
              }
            );

            const members = response.data?.records || response.data?.data || [];
            const member = members.find((m: any) => m.email === targetEmail);

            if (member) return member;

            const hasNextPage = response.data?.has_next_page;
            if (hasNextPage && page < 10) {
              return fetchMemberByEmail(targetEmail, page + 1);
            }

            return null;
          }

          const profile = await fetchMemberByEmail(userEmail);

          if (!profile) {
            throw new Error('Profile not found for update');
          }

          // Build update payload with custom fields
          const updatePayload: any = {};

          // Handle name field - this is the display name (preferred for updates)
          if (updateData.name) {
            updatePayload.name = updateData.name;
          }

          // Handle first_name and last_name separately if provided
          if (updateData.first_name) updatePayload.first_name = updateData.first_name;
          if (updateData.last_name) updatePayload.last_name = updateData.last_name;
          if (updateData.headline) updatePayload.headline = updateData.headline;

          // Custom fields go in profile_fields
          if (custom_fields || updateData.bio || updateData.location || updateData.website) {
            updatePayload.profile_fields = {};

            if (updateData.bio) updatePayload.profile_fields.bio = updateData.bio;
            if (updateData.location) updatePayload.profile_fields.location = updateData.location;
            if (updateData.website) updatePayload.profile_fields.website = updateData.website;

            // Add any additional custom fields
            if (custom_fields) {
              Object.assign(updatePayload.profile_fields, custom_fields);
            }
          }

          // Update via Admin API v2
          await axios.patch(
            `${config.headlessBaseUrl}/api/admin/v2/community_members/${profile.id}`,
            updatePayload,
            {
              headers: {
                'Authorization': `Bearer ${config.adminV2Token}`,
                'Content-Type': 'application/json',
              },
              timeout: 15000,
            }
          );

          return {
            content: [{
              type: 'text',
              text: '✅ Profile updated successfully',
            }],
          };

        } else {
          // Fallback to Member API (limited fields)
          logger.warn('Admin V2 token not available, using Member API (limited fields)');
          await apiClient.put(endpoints.updateProfile(), userEmail, updateData);

          return {
            content: [{
              type: 'text',
              text: '✅ Profile updated successfully (Note: Some fields may require Admin API v2 token)',
            }],
          };
        }

      } catch (error) {
        logger.error('Failed to update profile', error as Error);
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
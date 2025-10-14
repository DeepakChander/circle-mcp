import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CircleAPIClient } from '../api/client.js';
import type { IntegratedAuthManager } from '../auth/integrated-auth-manager.js';
import { endpoints } from '../api/endpoints.js';
import { Logger } from '../utils/logger.js';
import type { CircleEvent } from '../types/index.js';
import { withAuthentication } from './auth-wrapper.js';
import { extractArrayFromResponse, formatErrorMessage } from '../utils/response-handler.js';

const logger = new Logger('EventTools');

export function registerEventTools(
  server: McpServer,
  apiClient: CircleAPIClient,
  authManager: IntegratedAuthManager,
  readOnlyMode: boolean
) {
  server.registerTool(
    'get_events',
    {
      title: 'Get Events',
      description: 'List upcoming community events',
      inputSchema: { // FIXED
        page: z.number().int().positive().default(1),
        per_page: z.number().int().positive().max(100).default(20),
      },
    },
    withAuthentication(authManager, async (params) => {
      try {
        const email = (params as any).authenticatedEmail;
        const response = await apiClient.get<any>(
          endpoints.getEvents(params),
          email
        );

        // Robustly extract events array from response
        const eventsArray = extractArrayFromResponse<CircleEvent>(response);

        if (eventsArray.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No upcoming events found. Check back later for new events!',
            }],
          };
        }

        const events = eventsArray.map(event => ({
          id: event.id,
          name: event.name,
          starts_at: event.starts_at,
          location: event.location_type,
          attendees: event.attendees_count || 0,
          is_attending: event.is_attending || false,
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total: events.length,
              events,
            }, null, 2),
          }],
        };
      } catch (error) {
        logger.error('Failed to get events', error as Error);
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
    server.registerTool(
      'rsvp_event',
      {
        title: 'RSVP to Event',
        description: 'Register for an event',
        inputSchema: { // FIXED
          event_id: z.number().int().positive(),
        },
      },
      withAuthentication(authManager, async (params) => {
        try {
          const email = (params as any).authenticatedEmail;
          await apiClient.post(
            endpoints.rsvpEvent(params.event_id),
            email,
            {}
          );

          return {
            content: [{
              type: 'text',
              text: '✅ Successfully registered for event',
            }],
          };
        } catch (error) {
          logger.error('Failed to RSVP event', error as Error);
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
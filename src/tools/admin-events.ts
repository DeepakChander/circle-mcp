import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { adminV2Request } from '../api/admin-v2-client.js';
import { ADMIN_V2_ENDPOINTS } from '../config/constants.js';
import { Logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/response-handler.js';

const logger = new Logger('AdminEventTools');

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function err(text: string) {
  return { content: [{ type: 'text' as const, text }], isError: true };
}

export function registerAdminEventTools(server: McpServer, readOnlyMode: boolean): void {
  // --- Read tools ---

  server.registerTool(
    'admin_list_events',
    {
      title: 'Admin: List Events',
      description: 'List community events with pagination (Admin V2 API)',
      inputSchema: {
        space_id: z.number().int().positive().optional().describe('Filter by space ID'),
        status: z.string().optional().describe('Filter by status (upcoming, past, draft)'),
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
          endpoint: ADMIN_V2_ENDPOINTS.EVENTS,
          params: queryParams,
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list events', error as Error);
        return err(`Failed to list events: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_get_event',
    {
      title: 'Admin: Get Event',
      description: 'Get a specific event by ID (Admin V2 API)',
      inputSchema: {
        event_id: z.number().int().positive().describe('Event ID'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.EVENT(params.event_id),
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to get event', error as Error);
        return err(`Failed to get event: ${formatErrorMessage(error)}`);
      }
    }
  );

  server.registerTool(
    'admin_list_event_attendees',
    {
      title: 'Admin: List Event Attendees',
      description: 'List attendees of an event (Admin V2 API)',
      inputSchema: {
        event_id: z.number().int().positive().describe('Event ID'),
        page: z.number().int().positive().default(1).describe('Page number'),
        per_page: z.number().int().positive().max(100).default(20).describe('Results per page'),
      },
    },
    async (params) => {
      try {
        const data = await adminV2Request({
          method: 'GET',
          endpoint: ADMIN_V2_ENDPOINTS.EVENT_ATTENDEES,
          params: { event_id: params.event_id, page: params.page, per_page: params.per_page },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        logger.error('Failed to list event attendees', error as Error);
        return err(`Failed to list event attendees: ${formatErrorMessage(error)}`);
      }
    }
  );

  // --- Destructive tools ---

  if (!readOnlyMode) {
    server.registerTool(
      'admin_create_event',
      {
        title: 'Admin: Create Event',
        description: 'Create a new community event (Admin V2 API)',
        inputSchema: {
          space_id: z.number().int().positive().describe('Space ID for the event'),
          name: z.string().min(1).max(255).describe('Event name'),
          description: z.string().optional().describe('Event description'),
          body: z.string().optional().describe('Event body content (HTML)'),
          starts_at: z.string().describe('Start time (ISO 8601 format)'),
          ends_at: z.string().optional().describe('End time (ISO 8601 format)'),
          duration_in_seconds: z.number().int().positive().optional().describe('Duration in seconds'),
          location_type: z.enum(['in_person', 'virtual', 'hybrid']).default('virtual').describe('Location type'),
          virtual_location_url: z.string().optional().describe('Virtual meeting URL'),
          in_person_location: z.string().optional().describe('Physical location address'),
          rsvp_limit: z.number().int().positive().optional().describe('Maximum attendees'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.EVENTS,
            data: params,
          });
          return ok(`Event created successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to create event', error as Error);
          return err(`Failed to create event: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_update_event',
      {
        title: 'Admin: Update Event',
        description: 'Update an existing event (Admin V2 API)',
        inputSchema: {
          event_id: z.number().int().positive().describe('Event ID to update'),
          name: z.string().min(1).max(255).optional().describe('Event name'),
          description: z.string().optional().describe('Event description'),
          body: z.string().optional().describe('Event body content'),
          starts_at: z.string().optional().describe('Start time (ISO 8601)'),
          ends_at: z.string().optional().describe('End time (ISO 8601)'),
          location_type: z.enum(['in_person', 'virtual', 'hybrid']).optional().describe('Location type'),
          virtual_location_url: z.string().optional().describe('Virtual meeting URL'),
          in_person_location: z.string().optional().describe('Physical location'),
          rsvp_limit: z.number().int().positive().optional().describe('Maximum attendees'),
        },
      },
      async (params) => {
        try {
          const { event_id, ...updateData } = params;
          const data = await adminV2Request({
            method: 'PATCH',
            endpoint: ADMIN_V2_ENDPOINTS.EVENT(event_id),
            data: updateData,
          });
          return ok(`Event updated successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to update event', error as Error);
          return err(`Failed to update event: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_delete_event',
      {
        title: 'Admin: Delete Event',
        description: 'Delete an event (Admin V2 API)',
        inputSchema: {
          event_id: z.number().int().positive().describe('Event ID to delete'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.EVENT(params.event_id),
          });
          return ok('Event deleted successfully.');
        } catch (error) {
          logger.error('Failed to delete event', error as Error);
          return err(`Failed to delete event: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_add_event_attendee',
      {
        title: 'Admin: Add Event Attendee',
        description: 'Add a member as an attendee to an event (Admin V2 API)',
        inputSchema: {
          event_id: z.number().int().positive().describe('Event ID'),
          community_member_id: z.number().int().positive().describe('Member ID to add'),
        },
      },
      async (params) => {
        try {
          const data = await adminV2Request({
            method: 'POST',
            endpoint: ADMIN_V2_ENDPOINTS.EVENT_ATTENDEES,
            data: { event_id: params.event_id, community_member_id: params.community_member_id },
          });
          return ok(`Attendee added successfully:\n${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          logger.error('Failed to add event attendee', error as Error);
          return err(`Failed to add event attendee: ${formatErrorMessage(error)}`);
        }
      }
    );

    server.registerTool(
      'admin_remove_event_attendee',
      {
        title: 'Admin: Remove Event Attendee',
        description: 'Remove an attendee from an event (Admin V2 API)',
        inputSchema: {
          event_id: z.number().int().positive().describe('Event ID'),
          attendee_id: z.number().int().positive().describe('Attendee ID to remove'),
        },
      },
      async (params) => {
        try {
          await adminV2Request({
            method: 'DELETE',
            endpoint: ADMIN_V2_ENDPOINTS.EVENT_ATTENDEES,
            params: { event_id: params.event_id, community_member_id: params.attendee_id },
          });
          return ok('Attendee removed successfully.');
        } catch (error) {
          logger.error('Failed to remove event attendee', error as Error);
          return err(`Failed to remove event attendee: ${formatErrorMessage(error)}`);
        }
      }
    );
  }
}

export function registerAdminEventToolsForSession(server: McpServer, readOnlyMode: boolean): void {
  registerAdminEventTools(server, readOnlyMode);
}

import { default as sdk, z } from '@botpress/sdk'
import * as entities from './entities'

export const actions = {
  listEvents: {
    title: 'List Events',
    description: 'Retrieves events from the calendar.',
    input: {
      schema: z.object({
        count: z
          .number()
          .min(1)
          .max(2500)
          .default(100)
          .title('Number of events to retrieve')
          .describe('The maximum number of events to return. Defaults to 100.'),
        pageToken: z.string().title('Page token').optional().describe('Token specifying which result page to return.'),
        timeMin: z
          .string()
          .title('On or after')
          .optional()
          .describe(
            'Only return events occurring on or after this date. Must be in RFC3339 format. Defaults to now if not specified.'
          ),
      }),
    },
    output: {
      schema: z.object({
        events: z
          .array(entities.Event.schema.title('Event').describe('The calendar event data.'))
          .title('Events')
          .describe('The list of calendar events.'),
        nextPageToken: z
          .string()
          .title('Next page token')
          .optional()
          .describe('Token used to access the next page of this result. Omitted if no further results are available.'),
      }),
    },
  },

  createEvent: {
    title: 'Create Event',
    description: 'Creates a new event in the calendar.',
    input: {
      schema: entities.Event.schema
        .omit({ eventType: true, htmlLink: true, id: true, conferenceLink: true })
        .extend({
          attendees: z
            .array(
              z.object({
                email: z.string().email().title('Email').describe('The email address of the attendee.'),
                displayName: z
                  .string()
                  .title('Display Name')
                  .optional()
                  .describe('The name of the attendee. Optional.'),
                optional: z
                  .boolean()
                  .title('Optional Attendee')
                  .optional()
                  .default(false)
                  .describe('Whether this is an optional attendee. Optional. The default is False.'),
              })
            )
            .title('Attendees')
            .optional()
            .describe('List of attendees for the event. Email invitations will be sent automatically.'),
        })
        .title('New Event')
        .describe('The definition of the new event.'),
    },
    output: {
      schema: entities.Event.schema.title('Created Event').describe('The data of the new event.'),
    },
  },

  updateEvent: {
    title: 'Update Event',
    description: 'Updates an existing event in the calendar. Omitted properties are left unchanged.',
    input: {
      schema: entities.Event.schema.omit({ eventType: true, htmlLink: true, conferenceLink: true }).extend({
        id: z.string().title('Event ID').describe('The ID of the calendar event to update.'),
        attendees: z
          .array(
            z.object({
              email: z.string().email().title('Email').describe('The email address of the attendee.'),
              displayName: z.string().title('Display Name').optional().describe('The name of the attendee. Optional.'),
              optional: z
                .boolean()
                .title('Optional Attendee')
                .optional()
                .default(false)
                .describe('Whether this is an optional attendee. Optional. The default is False.'),
            })
          )
          .title('Attendees')
          .optional()
          .describe('List of attendees for the event.'),
      }),
    },
    output: {
      schema: entities.Event.schema.title('Updated Event').describe('The data of the event.'),
    },
  },

  deleteEvent: {
    title: 'Delete Event',
    description: 'Deletes an event from the calendar.',
    input: {
      schema: z.object({
        eventId: z.string().title('Event ID').describe('The ID of the calendar event to delete.'),
      }),
    },
    output: {
      schema: z.object({}),
    },
  },
  checkAvailability: {
    title: 'Check Availability',
    description: 'Checks calendar availability and returns free time slots for the specified date range.',
    input: {
      schema: z.object({
        timeMin: z
          .string()
          .title('Start Time')
          .describe('Start of the time range to check (ISO 8601 format, e.g., "2025-11-05T09:00:00-04:00").'),
        timeMax: z
          .string()
          .title('End Time')
          .describe('End of the time range to check (ISO 8601 format, e.g., "2025-11-05T17:00:00-04:00").'),
        slotDurationMinutes: z
          .number()
          .min(15)
          .max(480)
          .default(45)
          .title('Slot Duration (minutes)')
          .describe('Duration of each time slot in minutes. Defaults to 45 minutes.'),
        timezone: z
          .string()
          .default('America/Toronto')
          .title('Timezone')
          .describe('Timezone for formatting output (e.g., "America/Toronto"). Defaults to America/Toronto.'),
      }),
    },
    output: {
      schema: z.object({
        freeSlots: z
          .array(
            z.object({
              start: z.string().title('Start Time').describe('ISO 8601 formatted start time of the free slot.'),
              end: z.string().title('End Time').describe('ISO 8601 formatted end time of the free slot.'),
            })
          )
          .title('Free Slots')
          .describe('Array of available time slots in ISO format.'),
        formattedFreeSlots: z
          .array(z.string())
          .title('Formatted Free Slots')
          .describe('Array of human-readable formatted free slots (e.g., "9:00 AM – 9:45 AM").'),
        busySlots: z
          .array(
            z.object({
              start: z.string().title('Start Time').describe('ISO 8601 formatted start time of the busy slot.'),
              end: z.string().title('End Time').describe('ISO 8601 formatted end time of the busy slot.'),
            })
          )
          .title('Busy Slots')
          .describe('Array of busy time slots in ISO format.'),
      }),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']

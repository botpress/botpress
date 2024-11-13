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
        .omit({ eventType: true, htmlLink: true, id: true })
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
      schema: entities.Event.schema.omit({ eventType: true, htmlLink: true }).extend({
        id: z.string().title('Event ID').describe('The ID of the calendar event to update.'),
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
} as const satisfies sdk.IntegrationDefinitionProps['actions']

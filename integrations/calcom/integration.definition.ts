import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'
import { eventScheduledSchema } from './definitions/events'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.2.2',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      calcomApiKey: z
        .string()
        .min(1, 'API Key is required')
        .startsWith('cal_', 'Invalid API Key format')
        .describe('Your Cal.com API Key. You can find it in your Cal.com account settings.'),
    }),
  },
  user: {
    tags: {
      id: { title: 'User ID', description: 'The ID of the user' },
    },
  },
  events: {
    eventScheduled: {
      title: 'Event Scheduled',
      description: 'An event that triggers when an invitee fills out and submits a scheduling form',
      schema: eventScheduledSchema,
    },
  },
  actions: {
    getEventTypes: {
      title: 'Get Event Types',
      description: 'Fetches all event types from Cal.com',
      input: {
        schema: z.object({}),
      },
      output: {
        schema: z.object({
          eventTypes: z.array(
            z.object({
              id: z.number(),
              lengthInMinutes: z.number(),
              title: z.string(),
              slug: z.string(),
              description: z.string(),
              lengthInMinutesOptions: z.array(z.number()),
            })
          ),
        }),
      },
    },
    getAvailableTimeSlots: {
      title: 'Get Available Time Slots',
      description:
        'Fetches available time slots for a specific event type within a date range ( default to next 7 days if not provided )',
      input: {
        schema: z.object({
          eventTypeId: z.number().min(1, 'Event Type ID is required'),
          startDate: z.string().optional().describe('Start date in YYYY-MM-DD format'),
          endDate: z.string().optional().describe('End date in YYYY-MM-DD format'),
        }),
      },
      output: {
        schema: z.object({
          slots: z.record(z.string(), z.array(z.record(z.string(), z.string()))),
        }),
      },
    },
    generateLink: {
      title: 'Generate a link',
      description: 'Generates a link to a calendar',
      input: {
        schema: z.object({
          conversationId: z.string(),
          email: z.string().email('Invalid email address'),
        }),
      },
      output: {
        schema: z.object({
          url: z.string(),
        }),
      },
    },
  },
})

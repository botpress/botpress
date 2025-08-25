import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'
import { eventScheduledSchema } from './definitions/events'
import {
  bookEventInputSchema,
  bookEventOutputSchema,
  generateLinkInputSchema,
  generateLinkOutputSchema,
  getAvailableTimeSlotsInputSchema,
  getAvailableTimeSlotsOutputSchema,
  getEventTypesInputSchema,
  getEventTypesOutputSchema,
} from './definitions/actions'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.3.0',
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
      input: { schema: getEventTypesInputSchema },
      output: { schema: getEventTypesOutputSchema },
    },
    getAvailableTimeSlots: {
      title: 'Get Available Time Slots',
      description:
        'Fetches available time slots for a specific event type within a date range ( default to next 7 days if not provided )',
      input: { schema: getAvailableTimeSlotsInputSchema },
      output: { schema: getAvailableTimeSlotsOutputSchema },
    },
    generateLink: {
      title: 'Generate a link',
      description: 'Generates a link to a calendar',
      input: { schema: generateLinkInputSchema },
      output: { schema: generateLinkOutputSchema },
    },
    bookEvent: {
      title: 'Book an Event',
      description: 'Books an event for a user',
      input: { schema: bookEventInputSchema },
      output: { schema: bookEventOutputSchema },
    },
  },
})

import { z, IntegrationDefinition } from '@botpress/sdk'
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
  name: 'calcom',
  title: 'Cal.com',
  version: '0.4.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Schedule meetings and manage events using the Cal.com scheduling platform.',
  configuration: {
    schema: z.object({
      calcomApiKey: z
        .string()
        .startsWith('cal_', 'Invalid API Key format')
        .describe('Your Cal.com API Key. You can find it in your Cal.com account settings.')
        .title('Cal.com API Key'),
    }),
  },
  user: {
    tags: {
      id: { title: 'User ID', description: 'The ID of the user' },
    },
  },
  events: {},
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

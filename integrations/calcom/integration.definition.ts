import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'
import { eventScheduledSchema } from './definitions/events'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.2.0',
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
  states: {
    webhook: {
      type: 'conversation',
      schema: z.object({
        conversationId: z.string(),
      }),
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
    generateLink: {
      title: 'Generate a link',
      description: 'Generates a link to a calendar',
      input: {
        schema: z.object({
          conversationId: z.string(),
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

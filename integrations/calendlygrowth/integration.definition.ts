import { IntegrationDefinition, z } from '@botpress/sdk'
import { name, integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName ?? name,
  version: '1.0.3',
  icon: 'logo.svg',
  readme: 'hub.md',
  title: 'Calendly',
  description: 'This integration allows you to schedule events with Calendly.',
  channels: {},
  configuration: {
    schema: z.object({
      accessToken: z.string().describe('Personal Access Token from Calendly'),
    }),
  },
  actions: {
    scheduleEvent: {
      title: 'Schedule Calendly Event',
      description: 'Schedule a Calendly event',
      input: {
        schema: z.object({
          conversationId: z.string().describe('ID of the conversation'),
          eventTypeUrl: z.string().describe('URL of the event type'),
        }),
      },
      output: {
        schema: z.object({
          link: z.string().url().describe('URL for the event'),
        })
      },
    }
  },
  events: {
    calendlyEvent: {
      title: 'Calendly Event',
      description: 'This event is received after an invitee schedules with the Calendly link.',
      schema: z.object({
        conversation: z.object({
          id: z.string().describe('ID of the conversation'),
        }),
        data: z.record(z.any()),
      }).passthrough(),
    },
  },
})

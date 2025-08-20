import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'
import { eventScheduledSchema } from './definitions/events';

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.20',
  readme: 'hub.md',
  icon: 'icon.svg',
  user: {
    tags: {
      id: { title: 'User ID', description: 'The ID of the user' },
    },
  },
  states: {
      webhook: {
          type: 'conversation',
          schema: z.object({
              conversationId: z.string()
          })
      }
  },
  events: {
      eventScheduled: {
          title: 'Event Scheduled',
          description: 'An event that triggers when an invitee fills out and submits a scheduling form',
          schema: eventScheduledSchema
      }
  },
  actions: {
      generateLink: {
          title: 'Generate a link',
          description: 'Generates a link to a calendar',
          input: {
              schema: z.object({
                  conversationId: z.string()
              })
          },
      output: {
        schema: z.object({
          message: z.string(),
        }),
      },
      }
  }
})

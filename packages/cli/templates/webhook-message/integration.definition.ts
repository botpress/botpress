import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      webhookUrl: z.string().describe('The url to post the bot answers to.'),
    }),
  },
  channels: {
    webhook: {
      conversation: {
        tags: {
          id: { title: 'Conversation ID', description: 'The ID of the conversation' },
        },
      },
      messages: {
        // this channel only supports text messages
        text: {
          schema: z.object({
            text: z.string(),
          }),
        },
      },
    },
  },
  user: {
    tags: {
      id: { title: 'User ID', description: 'The ID of the user' },
    },
  },
})

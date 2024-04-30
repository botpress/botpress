import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from '@botpress/sdk'

// This is not used
export const channels = {
  channel: {
    title: 'Freshchat',
    messages: {
      text: {
        schema: z.object({
          text: z.string()
        })
      },
    },
    message: {
      tags: {},
    },
    conversation: {
      tags: {
        freshchatConversationId: { title: 'Freshchat Conversation Id', description: 'Freshchat Conversation Id' },
        botpressConversationId: { title: 'Botpress Conversation Id', description: 'Botpress Conversation Id' }
      }
    }
  },
} satisfies IntegrationDefinitionProps['channels']

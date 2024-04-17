import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

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
      tags: {
        origin: {
          title: 'Freshchat or Botpress',
          description: 'The origin of the message',
        },
      },
    },
    conversation: {
      tags: {
        freshchatConversationId: {
          title: 'Freshchat Conversation',
        },
        freshchatUserId: {
          title: 'Freshchat User',
        },
        userId: {
          title: 'Botpress/Freshchat Proxy User',
        }
      }
    }
  },
} satisfies IntegrationDefinitionProps['channels']

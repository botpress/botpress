import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from '@botpress/sdk'

// This is not used
export const channels = {
  hitl: {
    title: 'Freshchat',
    messages: {},
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

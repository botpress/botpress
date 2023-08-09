import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

export const channels = {
  ticket: {
    title: 'Zendesk Ticket',
    messages: {
      text: {
        schema: z.object({
          text: z.string(),
          userId: z.string(),
        }),
      },
    },
    message: {
      tags: {
        id: {},
        origin: {
          title: 'zendesk or botpress',
          description: 'The origin of the message',
        },
      },
    },
    conversation: {
      tags: {
        id: {
          title: 'Zendesk Ticket ID',
        },
        originConversationId: {
          title: 'Origin Conversation ID (the non-Zendesk one)',
        },
      },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
} satisfies IntegrationDefinitionProps['channels']

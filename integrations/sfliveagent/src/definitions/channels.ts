import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from '@botpress/sdk'

export const channels = {
  channel: {
    title: 'Salesforce LiveAgent',
    messages: {
      text: {
        schema: z.object({
          text: z.string(),
        }),
      },
    },
    message: {
      tags: {
        origin: {
          title: 'salesforce or botpress',
          description: 'The origin of the message',
        },
      },
    },
    conversation: {
      tags: {
        pollingKey: {
          title: 'Key for polling',
        },
        liveAgentSessionKey: {
          title: 'Key for polling',
        },
        botpressConversationId: {
          title: 'Id from the origin conversation',
        },
        botpressUserId: {
          title: 'Id from the user that will be listening',
        }
      }
    },
  },
} satisfies IntegrationDefinitionProps['channels']

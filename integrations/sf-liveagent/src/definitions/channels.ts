import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

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
        }
      },
      creation: { enabled: true, requiredTags: ['pollingKey'] },
    },
  },
} satisfies IntegrationDefinitionProps['channels']

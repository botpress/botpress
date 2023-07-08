import { IntegrationDefinitionProps, messages as baseMessages } from '@botpress/sdk'
import { z } from 'zod'

const messages = {
  ...baseMessages.defaults,
  text: {
    schema: z.object({
      text: z.string().optional(),
      blocks: z.array(z.any()).optional(),
    }),
  },
}

export const channels = {
  channel: {
    title: 'Channel',
    messages,
    message: { tags: { ts: {} } },
    conversation: {
      tags: { id: {} },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
  dm: {
    title: 'Direct Message',
    messages,
    message: { tags: { ts: {} } },
    conversation: {
      tags: { id: {} },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
  thread: {
    title: 'Thread',
    messages,
    message: { tags: { ts: {} } },
    conversation: {
      tags: { id: {}, thread: {} },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
} satisfies IntegrationDefinitionProps['channels']

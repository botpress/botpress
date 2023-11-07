import { IntegrationDefinitionProps, messages as baseMessages } from '@botpress/sdk'
import { textSchema } from './schemas'

const messages = {
  ...baseMessages.defaults,
  text: {
    schema: textSchema,
  },
}

const convoTags = {
  id: {},
  title: {},
} as const

export const channels = {
  channel: {
    title: 'Channel',
    messages,
    message: { tags: { ts: {} } },
    conversation: {
      tags: { ...convoTags },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
  dm: {
    title: 'Direct Message',
    messages,
    message: { tags: { ts: {} } },
    conversation: {
      tags: { ...convoTags },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
  thread: {
    title: 'Thread',
    messages,
    message: { tags: { ts: {} } },
    conversation: {
      tags: { ...convoTags, thread: {} },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
} satisfies IntegrationDefinitionProps['channels']

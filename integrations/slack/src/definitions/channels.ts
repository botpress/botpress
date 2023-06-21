import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

export const channels = {
  channel: {
    title: 'Channel',
    messages: messages.defaults,
    message: { tags: { ts: {} } },
    conversation: {
      tags: { id: {} },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
  dm: {
    title: 'Direct Message',
    messages: messages.defaults,
    message: { tags: { ts: {} } },
    conversation: {
      tags: { id: {} },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
  thread: {
    title: 'Thread',
    messages: messages.defaults,
    message: { tags: { ts: {} } },
    conversation: {
      tags: { id: {}, thread: {} },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
} satisfies IntegrationDefinitionProps['channels']

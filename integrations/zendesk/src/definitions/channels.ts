import { messages } from '@botpress/sdk'

export const channels = {
  ticket: {
    title: 'Ticket channel',
    messages: {
      text: messages.defaults.text,
    },
    message: { tags: { id: {} } },
    conversation: {
      tags: { id: {}, authorId: {} },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
}

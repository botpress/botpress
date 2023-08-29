import { getClient } from 'src/utils'
import type { Channels } from '../misc/types'

class NotImplementedError extends Error {
  constructor() {
    super('Not implemented')
  }
}

export const channels: Channels = {
  channel: {
    messages: {
      text: async ({ payload, ctx, conversation, ack }) => {
        const ZensunClient = getClient(ctx.configuration)
        const userExternalId = ctx.botUserId
        const messageData = {
          author: {
            type: 'user',
            userExternalId,
          },
          content: {
            type: 'text',
            text: payload.text,
          },
          metadata: {
            userExternalId,
          },
        }
        const conversationId = conversation.tags['zensun:id']
        const { messages } = await ZensunClient.postMessageSafe(
          conversationId || '',
          messageData
        )

        const message = messages[0]

        if (!message) {
          throw new Error('Message not sent')
        }

        await ack({ tags: { 'zensun:id': message.id } })

        if (messages.length > 1) {
          console.warn('More than one message was sent')
        }
      },
      image: async () => {
        throw new NotImplementedError()
      },
      markdown: async () => {
        throw new NotImplementedError()
      },
      audio: async () => {
        throw new NotImplementedError()
      },
      video: async () => {
        throw new NotImplementedError()
      },
      file: async () => {
        throw new NotImplementedError()
      },
      location: async () => {
        throw new NotImplementedError()
      },
      carousel: async () => {
        throw new NotImplementedError()
      },
      card: async () => {
        throw new NotImplementedError()
      },
      choice: async () => {
        throw new NotImplementedError()
      },
      dropdown: async () => {
        throw new NotImplementedError()
      },
    },
  },
}

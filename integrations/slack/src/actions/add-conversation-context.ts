import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const addConversationContext = wrapActionAndInjectSlackClient(
  { actionName: 'addConversationContext', errorMessage: 'Failed to add conversation context' },
  async ({ client, ctx, logger }, { conversationId, messages, channelOrigin }) => {
    logger.forBot().debug('Adding conversation context', { conversationId, messageCount: messages.length })

    for (const rawMessage of messages) {
      await client.createMessage({
        origin: 'synthetic',
        conversationId,
        userId: rawMessage.userId,
        type: rawMessage.type,
        payload: rawMessage.payload,
        tags: {
          channelOrigin,
          forkedToThread: 'false',
          userId: ctx.botId,
          channelId: conversationId,
          mentionsBot: 'true',
        },
      })
    }

    return {
      conversationId,
    }
  }
)

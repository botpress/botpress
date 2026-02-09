import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const addConversationContext = wrapActionAndInjectSlackClient(
  { actionName: 'addConversationContext', errorMessage: 'Failed to add conversation context' },
  async ({ client, ctx, logger }, { conversationId, messages, channelOrigin, triggerBotReply, botInstructions }) => {
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

    if (triggerBotReply) {
      // NOTE: Find the last non-bot user from the context messages to use as the sender of the trigger message.
      // This ensures the trigger looks like a user message, which will kick off a new bot turn.
      const lastUserMessage = [...messages].reverse().find((m) => m.userId !== ctx.botUserId)
      const triggerUserId = lastUserMessage?.userId ?? messages[messages.length - 1]?.userId

      if (triggerUserId) {
        const triggerText = botInstructions
          ? `[Continue this conversation. Instructions: ${botInstructions}]`
          : '[Continue this conversation based on the context above.]'

        logger.forBot().debug('Sending trigger message to start bot turn', { conversationId, triggerText })

        await client.createMessage({
          conversationId,
          userId: triggerUserId,
          type: 'text',
          payload: { text: triggerText },
          tags: {
            channelOrigin,
            forkedToThread: 'false',
            userId: triggerUserId,
            channelId: conversationId,
            mentionsBot: 'true',
          },
        })
      }
    }

    return {
      conversationId,
    }
  }
)

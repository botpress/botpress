import { wrapActionAndInjectSlackClient } from './action-wrapper'
import { retrieveChannelAndMessageTs } from './utils/message-utils'

const TYPING_INDICATOR_EMOJI = 'eyes'

export const startTypingIndicator = wrapActionAndInjectSlackClient(
  { actionName: 'startTypingIndicator', errorMessage: 'Failed to start typing indicator' },
  async ({ ctx, client, slackClient, logger }, { conversationId, messageId }) => {
    const { channel, ts } = await retrieveChannelAndMessageTs({
      client,
      messageId,
    })

    if (ctx.configuration.typingIndicatorEmoji) {
      logger
        .forBot()
        .debug(
          `Adding reaction "${TYPING_INDICATOR_EMOJI}" to message ${messageId} in conversation ${conversationId} (typing indicator)`
        )
      try {
        await slackClient.addReactionToMessage({
          channelId: channel,
          messageTs: ts,
          reactionName: TYPING_INDICATOR_EMOJI,
        })
      } catch (err: unknown) {
        // NOTE: Ignore "already_reacted" — this happens when startTypingIndicator is called
        // multiple times for the same message (e.g. multiple LLM iterations in a single turn)
        const isAlreadyReacted =
          err instanceof Error && 'data' in err && (err as any).data?.error === 'already_reacted'
        if (!isAlreadyReacted) {
          throw err
        }
      }
    }

    logger.forBot().debug(`Marking message ${messageId} as seen in conversation ${conversationId} (typing indicator)`)

    await slackClient.markMessageAsSeen({
      channelId: channel,
      messageTs: ts,
    })
  }
)

export const stopTypingIndicator = wrapActionAndInjectSlackClient(
  { actionName: 'stopTypingIndicator', errorMessage: 'Failed to stop typing indicator' },
  async ({ client, slackClient, logger, ctx }, { messageId, conversationId }) => {
    const { channel, ts } = await retrieveChannelAndMessageTs({
      client,
      messageId,
    })

    if (ctx.configuration.typingIndicatorEmoji) {
      logger
        .forBot()
        .debug(
          `Removing reaction "${TYPING_INDICATOR_EMOJI}" from message ${messageId} in conversation ${conversationId} (typing indicator)`
        )
      await slackClient.removeReactionFromMessage({
        channelId: channel,
        messageTs: ts,
        reactionName: TYPING_INDICATOR_EMOJI,
      })
    }
  }
)

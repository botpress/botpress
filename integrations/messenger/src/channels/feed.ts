import { createFacebookClient } from '../clients'
import * as bp from '.botpress'

const feed: bp.IntegrationProps['channels']['feed'] = {
  messages: {
    text: async (props) => {
      const { logger, conversation, payload, ctx } = props
      const { commentId } = conversation.tags

      if (!commentId) {
        logger.forBot().error('Comment ID is required to reply to comments')
        return
      }

      logger.forBot().debug(`Sending text message to Facebook feed: ${payload.text}`)
      await _replyToComment(commentId, payload.text, ctx, logger)
    },
    image: async (_props) => {
      // Empty implementation
    },
    markdown: async (_props) => {
      // Empty implementation
    },
    audio: async (_props) => {
      // Empty implementation
    },
    video: async (_props) => {
      // Empty implementation
    },
    file: async (_props) => {
      // Empty implementation
    },
    location: async (_props) => {
      // Empty implementation
    },
    carousel: async (_props) => {
      // Empty implementation
    },
    card: async (_props) => {
      // Empty implementation
    },
    dropdown: async (_props) => {
      // Empty implementation
    },
    choice: async (_props) => {
      // Empty implementation
    },
    bloc: async (_props) => {
      // Empty implementation
    },
  },
}

const _replyToComment = async (commentId: string, message: string, ctx: bp.Context, logger: bp.Logger) => {
  const facebookClient = await createFacebookClient(ctx)
  try {
    await facebookClient.replyToComment({
      commentId,
      message,
    })
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().error(`Failed to reply to comment ${commentId}: ${error.message}`)
    throw error
  }
}

export default feed

import { createFacebookClient } from '../misc/facebook-client'
import * as bp from '.botpress'

const feed: bp.IntegrationProps['channels']['feed'] = {
  messages: {
    text: async (props) => {
      const { logger, conversation, payload, ctx, client } = props
      const { commentId } = conversation.tags

      if (!commentId) {
        logger.forBot().error('Comment ID is required to reply to comments')
        return
      }

      await _replyToComment(commentId, payload.text, ctx, client, logger)
    },
    image: async () => {
      // Empty implementation
    },
    audio: async () => {
      // Empty implementation
    },
    video: async () => {
      // Empty implementation
    },
    file: async () => {
      // Empty implementation
    },
    location: async () => {
      // Empty implementation
    },
    carousel: async () => {
      // Empty implementation
    },
    card: async () => {
      // Empty implementation
    },
    dropdown: async () => {
      // Empty implementation
    },
    choice: async () => {
      // Empty implementation
    },
    bloc: async () => {
      // Empty implementation
    },
  },
}

const _replyToComment = async (
  commentId: string,
  message: string,
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger
) => {
  const facebookClient = await createFacebookClient(ctx, client, logger)
  try {
    logger.forBot().debug(`_replyToComment: Replying to comment ${commentId}: ${message}`)
    await facebookClient.replyToComment({
      commentId,
      message,
    })
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().error(`Failed to reply to comment ${commentId}: ${error.message}`)
  }
}

export default feed

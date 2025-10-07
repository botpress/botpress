import { RuntimeError } from '@botpress/sdk'
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
      throw new RuntimeError('Images are not supported for Feed. Use text instead.')
    },
    audio: async () => {
      throw new RuntimeError('Audio messages are not supported for Feed. Use text instead.')
    },
    video: async () => {
      throw new RuntimeError('Video messages are not supported for Feed. Use text instead.')
    },
    file: async () => {
      throw new RuntimeError('File messages are not supported for Feed. Use text instead.')
    },
    location: async () => {
      throw new RuntimeError('Location messages are not supported for Feed. Use text instead.')
    },
    carousel: async () => {
      throw new RuntimeError('Carousel messages are not supported for Feed. Use text instead.')
    },
    card: async () => {
      throw new RuntimeError('Card messages are not supported for Feed. Use text instead.')
    },
    dropdown: async () => {
      throw new RuntimeError('Dropdown messages are not supported for Feed. Use text instead.')
    },
    choice: async () => {
      throw new RuntimeError('Choice messages are not supported for Feed. Use text instead.')
    },
    bloc: async () => {
      throw new RuntimeError('Bloc messages are not supported for Feed. Use text instead.')
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

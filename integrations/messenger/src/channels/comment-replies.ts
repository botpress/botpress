import { RuntimeError } from '@botpress/sdk'
import { createFacebookClient } from '../misc/facebook-client'
import * as bp from '.botpress'

const commentReplies: bp.IntegrationProps['channels']['commentReplies'] = {
  messages: {
    text: async (props) => {
      const { logger, conversation, payload, ctx, client, ack } = props
      const { id } = conversation.tags

      if (!id) {
        logger.forBot().error('Comment ID is required to reply to comments')
        return
      }

      await _replyToComment(id, payload.text, ctx, client, logger, ack)
    },
    image: async () => {
      throw new RuntimeError('Images are not supported for Comment Replies. Use text instead.')
    },
    audio: async () => {
      throw new RuntimeError('Audio messages are not supported for Comment Replies. Use text instead.')
    },
    video: async () => {
      throw new RuntimeError('Video messages are not supported for Comment Replies. Use text instead.')
    },
    file: async () => {
      throw new RuntimeError('File messages are not supported for Comment Replies. Use text instead.')
    },
    location: async () => {
      throw new RuntimeError('Location messages are not supported for Comment Replies. Use text instead.')
    },
    carousel: async () => {
      throw new RuntimeError('Carousel messages are not supported for Comment Replies. Use text instead.')
    },
    card: async () => {
      throw new RuntimeError('Card messages are not supported for Comment Replies. Use text instead.')
    },
    dropdown: async () => {
      throw new RuntimeError('Dropdown messages are not supported for Comment Replies. Use text instead.')
    },
    choice: async () => {
      throw new RuntimeError('Choice messages are not supported for Comment Replies. Use text instead.')
    },
    bloc: async () => {
      throw new RuntimeError('Bloc messages are not supported for Comment Replies. Use text instead.')
    },
  },
}

const _replyToComment = async (
  id: string,
  message: string,
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger,
  ack: bp.AnyAckFunction
) => {
  const facebookClient = await createFacebookClient(ctx, client, logger)
  try {
    const response = await facebookClient.replyToComment({
      commentId: id,
      message,
    })

    // Update conversation tags with the new comment ID if ack is provided
    if (response.id) {
      await ack({ tags: { id: response.id } })
    }

    return response
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to reply to comment ${id}: ${error.message}`)
  }
}

export default commentReplies

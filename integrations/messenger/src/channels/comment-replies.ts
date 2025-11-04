import { RuntimeError } from '@botpress/sdk'
import { createAuthenticatedFacebookClient } from '../misc/facebook-client'
import * as bp from '.botpress'

const commentReplies: bp.IntegrationProps['channels']['commentReplies'] = {
  messages: {
    text: async (props) => {
      const { logger, conversation, payload, ctx, client, ack } = props
      const { id } = conversation.tags

      if (ctx.configurationType === 'sandbox') {
        logger.forBot().error('Comment replies are not supported in sandbox mode')
        return
      }

      if (!id) {
        logger.forBot().error('Comment ID is required to reply to comments')
        return
      }

      await _replyToComment({ id, message: payload.text, ctx, client, ack })
    },
  },
}

const _replyToComment = async ({
  id,
  message,
  ctx,
  client,
  ack,
}: {
  id: string
  message: string
  ctx: bp.Context
  client: bp.Client
  ack: bp.AnyAckFunction
}) => {
  const facebookClient = await createAuthenticatedFacebookClient(ctx, client)
  try {
    const response = await facebookClient.replyToComment({
      commentId: id,
      message,
    })

    // Update message tags with the new comment ID if ack is provided
    await ack({ tags: { id: response.id } })

    return response
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to reply to comment ${id}: ${error.message}`)
  }
}

export default commentReplies

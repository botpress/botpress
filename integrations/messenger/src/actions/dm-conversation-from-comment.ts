import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'
import { createAuthenticatedFacebookClient } from 'src/misc/facebook-client'

const dmConversationFromComment: bp.IntegrationProps['actions']['dmConversationFromComment'] = async (props) => {
  const { client, ctx, input } = props
  if (ctx.configurationType === 'sandbox') {
    throw new RuntimeError('Starting a conversation is not supported in sandbox mode')
  }

  const { commentId, message } = input

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { commentId },
  })

  const facebookClient = await createAuthenticatedFacebookClient(ctx, client)

  const response = await facebookClient
    .replyToComment({
      commentId,
      message,
    })
    .catch((thrown) => {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      throw new RuntimeError(`Failed to reply to comment ${commentId}: ${error.message}`)
    })

  await client
    .updateMessage({
      id: response.id,
      tags: { id: response.id },
    })
    .catch((thrown) => {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      throw new RuntimeError(`Failed to update message with comment ID ${commentId}: ${error.message}`)
    })

  await client.createMessage({
    origin: 'synthetic',
    conversationId: conversation.id,
    userId: ctx.botId,
    type: 'text',
    payload: { text: message },
    tags: { id: commentId },
  })

  return {
    conversationId: conversation.id,
  }
}

export default dmConversationFromComment

import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'
import { createAuthenticatedMessengerClient } from 'src/misc/messenger-client'

const dmConversationFromComment: bp.IntegrationProps['actions']['dmConversationFromComment'] = async (props) => {
  const { client, ctx, input } = props
  if (ctx.configurationType === 'sandbox') {
    throw new RuntimeError('Starting a conversation is not supported in sandbox mode')
  }

  const { commentId, message } = input

  
  const messengerClient = await createAuthenticatedMessengerClient(client, ctx)
  
  const { recipientId } = await messengerClient.sendText(
    {commentId},
    message
  ).catch((thrown) => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to send Messenger message from comment ${commentId}: ${error.message}`)
  })
  
  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { id: recipientId },
    discriminateByTags: ['id'],
  }).catch((thrown) => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to get or create conversation for recipient ${recipientId}: ${error.message}`)
  })
  
  await client.createMessage({
    origin: 'synthetic',
    conversationId: conversation.id,
    userId: ctx.botId,
    type: 'text',
    payload: { text: message },
    tags: { id: commentId },
  }).catch((thrown) => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to create synthetic message from comment ${commentId}: ${error.message}`)
  })

  return {
    conversationId: conversation.id,
  }
}

export default dmConversationFromComment

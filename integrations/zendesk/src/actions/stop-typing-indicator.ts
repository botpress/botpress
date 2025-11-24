import { RuntimeError } from '@botpress/client'
import { createMessagingClient } from '../messaging-client'
import * as bp from '.botpress'

export const stopTypingIndicator: bp.IntegrationProps['actions']['stopTypingIndicator'] = async ({
  client,
  ctx,
  input,
}) => {
  if (!ctx.configuration.messagingKeyId || !ctx.configuration.messagingKeySecret || !ctx.configuration.messagingAppId) {
    throw new RuntimeError(
      'Messaging client not configured. Please provide messagingKeyId, messagingKeySecret, and messagingAppId in the integration configuration.'
    )
  }

  const { conversation } = await client.getConversation({ id: input.conversationId })
  const conversationId = conversation.tags.id

  if (!conversationId) {
    throw new RuntimeError('Conversation does not have a messaging identifier')
  }

  // Create a fresh client each time, matching Sunco pattern
  const messagingClient = createMessagingClient(ctx.configuration.messagingKeyId, ctx.configuration.messagingKeySecret)

  // Note: messageId from input is not used by Sunshine Conversations API
  await messagingClient.activity.postActivity(ctx.configuration.messagingAppId, conversationId, {
    type: 'typing:stop',
    author: { type: 'business' },
  })

  return {}
}

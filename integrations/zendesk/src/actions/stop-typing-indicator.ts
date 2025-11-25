import { RuntimeError } from '@botpress/client'
import { getMessagingClient } from '../messaging-client'
import * as bp from '.botpress'

export const stopTypingIndicator: bp.IntegrationProps['actions']['stopTypingIndicator'] = async ({
  client,
  ctx,
  input,
  logger,
}) => {
  try {
    const { conversation } = await client.getConversation({ id: input.conversationId })
    const conversationId = conversation.tags.id

    if (!conversationId) {
      throw new RuntimeError('Conversation does not have a messaging identifier')
    }

    const messagingClient = getMessagingClient(ctx.configuration)

    // Note: messageId from input is not used by Sunshine Conversations API
    await messagingClient.activity.postActivity(ctx.configuration.messagingAppId!, conversationId, {
      type: 'typing:stop',
      author: { type: 'business' },
    })
  } catch (error) {
    logger.forBot().error('Failed to stop typing indicator', { error })
  }

  return {}
}

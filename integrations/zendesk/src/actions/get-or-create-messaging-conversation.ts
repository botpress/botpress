import { RuntimeError } from '@botpress/client'
import { getMessagingClient } from '../messaging-client'
import * as bp from '.botpress'

export const getOrCreateMessagingConversation: bp.IntegrationProps['actions']['getOrCreateMessagingConversation'] =
  async ({ client, input, ctx }) => {
    const messagingClient = getMessagingClient(ctx.configuration)
    if (!messagingClient || !ctx.configuration.messagingAppId) {
      throw new RuntimeError('Messaging client not configured')
    }

    const suncoConversation = await messagingClient.conversations.getConversation(
      ctx.configuration.messagingAppId,
      input.conversation.id
    )

    const { conversation } = await client.getOrCreateConversation({
      channel: 'messaging',
      tags: { id: `${suncoConversation.conversation?.id}` },
    })

    return {
      conversationId: conversation.id,
    }
  }

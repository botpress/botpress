import { getFreshchatClient } from 'src/client'
import * as bp from '.botpress'

export const startHITL: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, input, logger }) => {
  const freshchatClient = getFreshchatClient({ ...ctx.configuration })

  const { userId } = input

  let freshchatUser = await freshchatClient.getUserByEmail(userId)

  if(!freshchatUser) {
    console.log(`User with email ${userId} not Found, creating a new one`)

    freshchatUser = await freshchatClient.createUser({
      email: userId,
      first_name: userId,
      reference_id: userId
    })
  }

  if(!freshchatUser) {
    throw new Error('Failed to create freshchat user')
  }

  const freshchatConversation = await freshchatClient.createConversation({ userId: freshchatUser.id, transcript: input.description })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      freshchatConversationId: `${freshchatConversation.conversation_id}`,
    },
  })

  return {
    conversationId: conversation.id,
  }
}

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ ctx, input, client }) => {
  const { conversation } = await client.getConversation({
    id: input.conversationId,
  })

  const freshchatConversationId: string | undefined = conversation.tags.id
  if (!freshchatConversationId) {
    return {}
  }

  const freshchatClient = getFreshchatClient({ ...ctx.configuration })

  //TODO

  return {}
}

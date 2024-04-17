import { getFreshchatClient } from 'src/client'
import { ActionCreateConversation } from '../schemas'
import { executeConversationAssigned } from '../events/conversation-assigned'

export const createConversation: ActionCreateConversation = async ({ ctx, client, input, logger }) => {
  const freshchatClient = getFreshchatClient({ ...ctx.configuration })

  const botpressUser = await client.getUser({
    id: input.userId
  })

  if(!botpressUser) {
    logger.forBot().error(`Botpress User ${input.userId} doesn't exist`)
    return;
  }

  const freshdeskUserId = botpressUser.user.tags.freshchatUserId;

  if(!freshdeskUserId) {
    logger.forBot().error(`The Botpress User has an invalid Freshdesk User Associated: ${freshdeskUserId}, please use getCreateUser to get a associated user.`)
    return;
  }

  const freshchatConversation = await freshchatClient.createConversation({ userId: freshdeskUserId, transcript: input.transcript })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      freshchatConversationId: freshchatConversation.conversation_id,
      freshchatUserId: freshdeskUserId,
      userId: input.userId
    }
  })

  void executeConversationAssigned({ client, conversation: { id: input.originConversationId }, user: { id: input.originUserId }, agent_name: 'Me David :)'})

  return { ...conversation, freshchat: freshchatConversation }
}

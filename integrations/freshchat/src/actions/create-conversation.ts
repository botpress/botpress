import { getFreshchatClient } from 'src/client'
import { ActionCreateConversation } from '../schemas'
import { executeConversationAssigned } from '../events/conversation-assigned'
import * as console from 'node:console'

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
      masterConversationId: input.originConversationId,
      freshchatConversationId: freshchatConversation.conversation_id,
      freshchatUserId: freshdeskUserId,
      userId: input.userId
    }
  })

  console.log('will create event with following parameters: ' + {
    type: 'onConversationAssigned',
    payload: {
      conversation: { id: input.originConversationId },
      agent_name: 'Me David :)'
    },
    conversationId: input.originConversationId,
    userId: input.originUserId
  })

  const event = await client.createEvent({
    type: 'onConversationAssigned',
    payload: {
      conversation: { id: input.originConversationId },
      user: { id: ctx.botUserId },
      agent_name: 'Me David :)'
    },
    conversationId: input.originConversationId,
    userId: ctx.botUserId
  })

  console.log('created event: ', event)

  return { ...conversation, freshchat: freshchatConversation }
}

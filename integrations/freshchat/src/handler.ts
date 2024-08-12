
import { IntegrationProps } from '.botpress'

export const handler: IntegrationProps['handler'] = async ({ ctx, req, logger, client }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  console.log('Received body: ', req.body)

  //https://crmsupport.freshworks.com/en/support/solutions/articles/50000004461-freshchat-webhooks-payload-structure-and-authentication
  const freshchatEvent= JSON.parse(req.body) as FreshchatEvent<any>

  const getConversationAndUser = async (freshchatConversationId: string, freshchatUserId?: string)=> {
    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: {
        id: freshchatConversationId,
      },
    })

    let user

    if(freshchatUserId) {
      user = (await client.getOrCreateUser({
        tags: {
          id: freshchatUserId,
        },
      })).user
    }

    return { conversation, user }
  }

  switch (freshchatEvent.action) {
    case 'message_create':
      const messageCreateEvent = freshchatEvent as MessageCreateFreshchatEvent

      // Message from the user, not agent, skip
      if(messageCreateEvent.actor.actor_type === 'user') {
        return
      }

      console.log('Received message create event', messageCreateEvent)

      const { conversation: cm, user: um } = await getConversationAndUser(
        messageCreateEvent.data.message.conversation_id,
        messageCreateEvent.actor.actor_id
      )

      for(const messagePart of messageCreateEvent.data.message.message_parts) {
        await client.createMessage({
          tags: {},
          type: 'text',
          userId: um?.id as string,
          conversationId: cm.id,
          payload: { text: messagePart.text.content  },
        })
      }
      break
    case 'conversation_assignment':
      const conversationAssignmentEvent = freshchatEvent as ConversationAssignmentFreshchatEvent

      const { conversation: ca, user: ua } = await getConversationAndUser(
        conversationAssignmentEvent.data.assignment.conversation.conversation_id,
        conversationAssignmentEvent.data.assignment.to_agent_id
      )

      await client.createEvent({
        type: 'hitlAssigned',
        payload: {
          conversationId: ca.id,
          userId: ua?.id  as string,
        },
      })

      break
    case 'conversation_resolution':
      const conversationResolutionEvent = freshchatEvent as ConversationResolutionFreshchatEvent

      const { conversation: cr} = await getConversationAndUser(
        conversationResolutionEvent.data.resolve.conversation.conversation_id
      )

      await client.createEvent({
        type: 'hitlStopped',
        payload: {
          conversationId: cr.id,
        },
      })

    break
    default:
      logger.forBot().warn('Invalid Freshchat event of type: ' + freshchatEvent.action)
  }
}

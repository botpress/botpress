
import { IntegrationProps } from '.botpress'

export const handler: IntegrationProps['handler'] = async ({ ctx, req, logger, client }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  console.log('Received body: ', req.body)

  //https://crmsupport.freshworks.com/en/support/solutions/articles/50000004461-freshchat-webhooks-payload-structure-and-authentication
  const freshchatEvent= JSON.parse(req.body) as FreshchatEvent<any>

  switch (freshchatEvent.action) {
    case 'message_create':
      const messageCreateEvent = freshchatEvent as MessageCreateFreshchatEvent

      // Message from the user, not agent, skip
      if(messageCreateEvent.actor.actor_type === 'user') {
        return
      }

      console.log('Received message create event', messageCreateEvent)

      //const details = await getLinkedConversationDetails (messageCreateEvent.data.message.conversation_id)

      const freshchatConversationId = messageCreateEvent.data.message.conversation_id

      const { conversation } = await client.getOrCreateConversation({
        channel: 'hitl',
        tags: {
          id: freshchatConversationId,
        },
      })

      const { user } = await client.getOrCreateUser({
        tags: {
          id: messageCreateEvent.actor.actor_id,
        },
      })

      for(const messagePart of messageCreateEvent.data.message.message_parts) {
        await client.createMessage({
          tags: {},
          type: 'text',
          userId: user.id,
          conversationId: conversation.id,
          payload: { text: messagePart.text.content  },
        })
      }
      break
    case 'conversation_assignment':
      const conversationAssignmentEvent = freshchatEvent as ConversationAssignmentFreshchatEvent

      const freshchatConversationId = conversationAssignmentEvent.data.assignment.conversation.conversation_id

      const { conversation } = await client.getOrCreateConversation({
        channel: 'hitl',
        tags: {
          id: freshchatConversationId,
        },
      })

      const { user } = await client.getOrCreateUser({
        tags: {
          id: conversationAssignmentEvent.data.assignment.conversation.assigned_agent_id,
        },
      })

      await client.createEvent({
        type: 'hitlAssigned',
        payload: {
          conversationId: conversation.id,
          userId: user.id,
        },
      })

      break
    case 'conversation_resolution':
      const conversationResolutionEvent = freshchatEvent as ConversationResolutionFreshchatEvent

      const freshchatConversationId = conversationResolutionEvent.data.resolve.conversation.conversation_id

      const { conversation } = await client.getOrCreateConversation({
        channel: 'hitl',
        tags: {
          id: freshchatConversationId,
        },
      })

      await client.createEvent({
        type: 'hitlStopped',
        payload: {
          conversationId: conversation.id,
        },
      })

    break
    default:
      logger.forBot().warn('Invalid Freshchat event of type: ' + freshchatEvent.action)
  }
}

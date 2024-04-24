
import { IntegrationProps } from '.botpress'
import * as console from 'node:console'

export const handler: IntegrationProps['handler'] = async ({ ctx, req, logger, client }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  console.log('Received body: ', req.body)

  //https://crmsupport.freshworks.com/en/support/solutions/articles/50000004461-freshchat-webhooks-payload-structure-and-authentication
  const freshchatEvent= JSON.parse(req.body) as FreshchatEvent<any>

  const getLinkedConversationDetails = async (freshchatConversationId: string) => {
    const linkedConversationsList = await client.listConversations({
      tags: {
        freshchatConversationId,
      }
    })

    const conversation = linkedConversationsList.conversations[0]

    if(!conversation) {
      throw new Error(`No conversation linked for freshchat conversation: ${freshchatConversationId}`)
    }

    console.log(`Got conversation using freshchatConversationId: ${freshchatConversationId}`, conversation)

    return {
      botpressConversationId: conversation.tags.botpressConversationId,
      botpressUserId: ctx.botUserId,
      freshchatConversationId,
    };
  }

  switch (freshchatEvent.action) {
    case 'message_create':
      const messageCreateEvent = freshchatEvent as MessageCreateFreshchatEvent

      // Message from the user, not agent, skip
      if(messageCreateEvent.actor.actor_type == "user") {
        return;
      }

      console.log('Received message create event', messageCreateEvent)

      const details = await getLinkedConversationDetails (messageCreateEvent.data.message.conversation_id)

      for(const messagePart of messageCreateEvent.data.message.message_parts) {
        await client.createEvent({
          type: 'onAgentMessage',
          payload: {
            ...details,
            message: { text: messagePart.text.content },
          }
        })
      }
      break;
    case 'conversation_assignment':
      const conversationAssignmentEvent = freshchatEvent as ConversationAssignmentFreshchatEvent;

      await client.createEvent({
        type: 'onConversationAssignment',
        payload: {
          ...await getLinkedConversationDetails (conversationAssignmentEvent.data.assignment.conversation.conversation_id)
        }
      })

      break;
    case 'conversation_resolution':
      const conversationResolutionEvent = freshchatEvent as ConversationResolutionFreshchatEvent;

      await client.createEvent({
        type: 'onConversationResolution',
        payload: {
          ...await getLinkedConversationDetails (conversationResolutionEvent.data.resolve.conversation.conversation_id)
        }
      })
    break;
    default:
      logger.forBot().warn('Invalid Freshchat event of type: ' + freshchatEvent.action)
  }
}

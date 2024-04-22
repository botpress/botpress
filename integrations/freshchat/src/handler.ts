
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

  switch (freshchatEvent.action) {
    case 'message_create':
      const messageCreateEvent = freshchatEvent as MessageCreateFreshchatEvent

      console.log('Received message create event', messageCreateEvent)

      // Freshdesk Channel Conversation
      const { conversation } = await client.getOrCreateConversation({
        channel: 'channel',
        tags: {
          freshchatConversationId: messageCreateEvent.data.message.conversation_id
        },
      })

      console.log(`Got conversation using freshdeskConversationId: ${messageCreateEvent.data.message.conversation_id}`, conversation)

      const { user } = await client.getOrCreateUser({
        tags: {
          freshchatUserId: conversation.tags.freshchatUserId
        },
      })

      for(const messagePart of messageCreateEvent.data.message.message_parts) {
        await client.createEvent({
          type: 'onAgentMessage',
          payload: {
            conversation: { id: conversation.tags.masterConversationId },
            user: { id: ctx.botUserId },
            message: { text: messagePart.text.content },
          }
        })

        /*await client.createMessage({
          userId: ctx.botUserId,
          conversationId: conversation.tags.masterConversationId,
          payload: { text: messagePart.text.content },
          type: 'text',
          tags: {}
        })*/
      }
      break;
    default:
      logger.forBot().warn('Invalid Freshchat event of type: ' + freshchatEvent.action)
  }
}

import { executeConversationStarted } from '../events/messaging/conversation-started'
import * as bp from '.botpress'

export const handleMessagingWebhook = async (props: bp.HandlerProps): Promise<boolean> => {
  const { req, ctx, client, logger } = props

  // Check if this is a messaging webhook by looking for the events array structure
  try {
    const parsedBody = JSON.parse(req.body || '{}')
    if (parsedBody.events && Array.isArray(parsedBody.events) && ctx.configuration.messagingAppId) {
      for (const event of parsedBody.events) {

        if (event.type === 'conversation:create') {
          await executeConversationStarted({ event, client, logger })
          continue
        }

        if (event.type !== 'conversation:message') {
          continue
        }

        const payload = event.payload

        if (payload.message.content.type !== 'text') {
          continue
        }

        if (payload.message.author.type === 'business') {
          continue
        }

        const { conversation: botpressConversation } = await client.getOrCreateConversation({
          channel: 'messaging',
          tags: {
            id: payload.conversation.id,
          },
        })

        const { user } = await client.getOrCreateUser({
          tags: {
            id: payload.message.author.userId,
          },
          name: payload.message.author.displayName,
          pictureUrl: payload.message.author.avatarUrl,
        })

        await client.createMessage({
          tags: { id: payload.message.id },
          type: 'text',
          userId: user.id,
          conversationId: botpressConversation.id,
          payload: { text: payload.message.content.text },
        })
      }

      return true
    }
  } catch {
    // If parsing fails or structure doesn't match, this is not a messaging webhook
  }

  return false
}

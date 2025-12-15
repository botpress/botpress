import type { ConversationCreateEvent } from '../messaging-events'
import { Logger, Client } from '.botpress'

export const executeConversationCreated = async (props: {
  event: ConversationCreateEvent
  client: Client
  logger: Logger
}) => {
  const { event, client, logger } = props
  const payload = event.payload

  const conversationId = payload.conversation?.id
  const userId = payload.user?.id

  if (!conversationId?.length || !userId?.length) {
    logger.forBot().warn('conversation:create event missing conversation ID or user ID')
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      id: conversationId,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: userId,
    },
  })

  await client.createEvent({
    type: 'conversationCreated',
    conversationId: conversation.id,
    userId: user.id,
    payload: {
      userId: user.id,
      conversationId: conversation.id,
    },
  })
}

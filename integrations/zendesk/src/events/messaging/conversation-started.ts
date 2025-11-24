import { Logger, Client } from '.botpress'

export const executeConversationStarted = async (props: {
  event: { payload: any }
  client: Client
  logger: Logger
}) => {
  const { event, client, logger } = props
  const payload = event.payload

  const conversationId = payload.conversation?.id
  const userId = payload.user?.id

  if (!conversationId || !userId) {
    logger.forBot().warn('conversation:create event missing conversation ID or user ID')
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'messaging',
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
    type: 'conversationStarted',
    conversationId: conversation.id,
    userId: user.id,
    payload: {
      userId: user.id,
      conversationId: conversation.id,
    },
  })
}

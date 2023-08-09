import { ConversationStarted } from '../misc/messaging/incoming-event'
import { IntegrationClient } from '../misc/types'
import { getUserAndConversation } from '../misc/utils'

export async function fireConversationStarted(convoStarted: ConversationStarted, client: IntegrationClient) {
  const { conversationId, userId } = await getUserAndConversation(
    {
      webchatConvoId: convoStarted.conversationId,
      webchatUserId: convoStarted.userId,
    },
    client
  )

  await client.createEvent({
    type: 'conversationStarted',
    payload: {
      userId,
      conversationId,
    },
  })
}

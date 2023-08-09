import { ConversationStarted } from '../misc/messaging/incoming-event'
import { Client } from '../misc/types'
import { getUserAndConversation } from '../misc/utils'

export async function fireConversationStarted(convoStarted: ConversationStarted, client: Client) {
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

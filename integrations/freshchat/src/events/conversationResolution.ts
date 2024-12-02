import { ConversationResolutionFreshchatEvent } from '../definitions/freshchat-events'
import * as bp from '.botpress'

export const executeConversationResolution = async ({
  freshchatEvent,
  client,
}: {
  freshchatEvent: ConversationResolutionFreshchatEvent
  client: bp.Client
}) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: freshchatEvent.data.resolve.conversation.conversation_id,
    },
  })

  await client.createEvent({
    type: 'hitlStopped',
    payload: {
      conversationId: conversation.id,
    },
  })
}

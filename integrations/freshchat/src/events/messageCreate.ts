import { MessageCreateFreshchatEvent } from '../definitions/freshchat-events'
import * as bp from '.botpress'

export const executeMessageCreate = async ({
  freshchatEvent,
  client,
}: {
  freshchatEvent: MessageCreateFreshchatEvent
  client: bp.Client
}) => {
  if (freshchatEvent.actor.actor_type === 'user') {
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: freshchatEvent.data.message.conversation_id,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: freshchatEvent.actor.actor_id,
    },
  })

  for (const messagePart of freshchatEvent.data.message.message_parts) {
    await client.createMessage({
      tags: {},
      type: 'text',
      userId: user?.id as string,
      conversationId: conversation.id,
      payload: { text: messagePart.text.content },
    })
  }
}

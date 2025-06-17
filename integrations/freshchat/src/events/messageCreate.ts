import { MessageCreateFreshchatEvent } from '../definitions/freshchat-events'
import { updateAgentUser } from '../util'
import * as bp from '.botpress'

export const executeMessageCreate = async ({
  freshchatEvent,
  client,
  ctx,
  logger,
}: {
  freshchatEvent: MessageCreateFreshchatEvent
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}) => {
  // Ignore non agent messages
  if (freshchatEvent.actor.actor_type === 'user') {
    return
  }

  // Ignore private messages
  if (freshchatEvent.data.message.message_type === 'private') {
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

  // An unassigned agent might send a message
  await updateAgentUser(user, client, ctx, logger)

  for (const messagePart of freshchatEvent.data.message.message_parts) {
    await client.createMessage({
      tags: {},
      type: 'text',
      userId: user?.id as string,
      conversationId: conversation.id,
      payload: {
        text: messagePart.text.content,
      },
    })
  }
}

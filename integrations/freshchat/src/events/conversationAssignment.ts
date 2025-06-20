import { ConversationAssignmentFreshchatEvent } from '../definitions/freshchat-events'
import { updateAgentUser } from '../util'
import * as bp from '.botpress'

export const executeConversationAssignment = async ({
  freshchatEvent,
  client,
  ctx,
  logger,
}: {
  freshchatEvent: ConversationAssignmentFreshchatEvent
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}) => {
  if (
    !freshchatEvent.data.assignment.to_agent_id.length ||
    freshchatEvent.data.assignment.from_agent_id === freshchatEvent.data.assignment.to_agent_id
  ) {
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: freshchatEvent.data.assignment.conversation.conversation_id,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: freshchatEvent.data.assignment.to_agent_id,
    },
  })

  await updateAgentUser(user, client, ctx, logger, true)

  await client.createEvent({
    type: 'hitlAssigned',
    payload: {
      conversationId: conversation.id,
      userId: user.id as string,
    },
  })
}

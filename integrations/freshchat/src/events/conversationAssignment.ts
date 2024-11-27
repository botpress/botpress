import { getFreshchatClient } from '../client'
import { ConversationAssignmentFreshchatEvent } from '../definitions/freshchat-events'
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

  // Update agent user
  if (!user?.name?.length) {
    try {
      const freshchatClient = getFreshchatClient({ ...ctx.configuration }, logger)
      const agentData = await freshchatClient.getAgentById(user.tags.id as string)
      void client.updateUser({
        ...user,
        name: agentData?.first_name + ' ' + agentData?.last_name,
        pictureUrl: agentData?.avatar?.url,
      })
    } catch (e: any) {
      logger.forBot().error(`Couldn't update the agent profile from Freshchat: ${e.message}`)
    }
  }

  await client.createEvent({
    type: 'hitlAssigned',
    payload: {
      conversationId: conversation.id,
      userId: user.id as string,
    },
  })
}

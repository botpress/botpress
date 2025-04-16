import { DEFAULT_HUMAN_AGENT_ASSIGNED_MESSAGE } from '../../../plugin.definition'
import * as conv from '../../conv-manager'
import * as consts from '../consts'
import * as bp from '.botpress'

export const handleEvent: bp.HookHandlers['before_incoming_event']['hitl:hitlAssigned'] = async (props) => {
  const { conversationId: downstreamConversationId, userId: humanAgentUserId } = props.data.payload

  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)
  const isHitlActive = await downstreamCm.isHitlActive()
  if (!isHitlActive) {
    return consts.STOP_EVENT_HANDLING
  }

  const downstreamConversation = await props.client.getConversation({ id: downstreamConversationId })
  const upstreamConversationId = downstreamConversation.conversation.tags['upstream']
  if (!upstreamConversationId) {
    props.logger
      .withConversationId(downstreamConversationId)
      .error('Downstream conversation was not binded to upstream conversation')
    return consts.STOP_EVENT_HANDLING
  }

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)

  const { user: humanAgentUser } = await props.client.getUser({ id: humanAgentUserId })
  const humanAgentName = humanAgentUser?.name ?? 'A Human Agent'

  await Promise.all([
    upstreamCm.respond({
      type: 'text',
      text: props.configuration.onHumanAgentAssignedMessage ?? DEFAULT_HUMAN_AGENT_ASSIGNED_MESSAGE,
    }),
    downstreamCm.setHumanAgent(humanAgentUserId, humanAgentName),
    upstreamCm.setHumanAgent(humanAgentUserId, humanAgentName),
  ])
  return consts.STOP_EVENT_HANDLING
}

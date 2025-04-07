import { DEFAULT_HUMAN_AGENT_ASSIGNED_MESSAGE } from '../../../plugin.definition'
import * as conv from '../../conv-manager'
import * as consts from '../consts'
import * as bp from '.botpress'

export const handleEvent: bp.HookHandlers['before_incoming_event']['hitl:hitlAssigned'] = async (props) => {
  const { conversationId: downstreamConversationId, userId: humanAgentUserId } = props.data.payload

  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)
  const isHitlActive = await downstreamCm.isHitlActive()
  if (!isHitlActive) {
    await _emitHitlAssignedEvent(props, downstreamConversationId, humanAgentUserId)
    return consts.STOP_EVENT_HANDLING
  }

  const downstreamConversation = await props.client.getConversation({ id: downstreamConversationId })
  const upstreamConversationId = downstreamConversation.conversation.tags['upstream']
  if (!upstreamConversationId) {
    props.logger
      .withConversationId(downstreamConversationId)
      .error('Downstream conversation was not binded to upstream conversation')

    await _emitHitlAssignedEvent(props, downstreamConversationId, humanAgentUserId)
    return consts.STOP_EVENT_HANDLING
  }

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)

  const { user: humanAgentUser } = await props.client.getUser({ id: humanAgentUserId })
  const humanAgentName = humanAgentUser?.name ?? 'A Human Agent'

  await Promise.all([
    upstreamCm.respond({
      text: props.configuration.onHumanAgentAssignedMessage ?? DEFAULT_HUMAN_AGENT_ASSIGNED_MESSAGE,
    }),
    downstreamCm.setHumanAgent(humanAgentUserId, humanAgentName),
    upstreamCm.setHumanAgent(humanAgentUserId, humanAgentName),
  ])

  await _emitHitlAssignedEvent(props, downstreamConversationId, humanAgentUserId, upstreamConversationId)

  return consts.STOP_EVENT_HANDLING
}

const _emitHitlAssignedEvent = async (
  props: bp.HookHandlerProps['before_incoming_event'],
  downstreamConversationId: string,
  humanAgentUserId: string,
  upstreamConversationId?: string
) => {
  await props.client.createEvent({
    type: 'hitlAssigned',
    payload: {
      downstreamConversationId,
      humanAgentUserId,
    },
    conversationId: upstreamConversationId,
  })
}

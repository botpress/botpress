import { DEFAULT_HITL_STOPPED_MESSAGE } from '../../../plugin.definition'
import * as conv from '../../conv-manager'
import * as consts from '../consts'
import * as bp from '.botpress'

export const handleEvent: bp.HookHandlers['before_incoming_event']['hitl:hitlStopped'] = async (props) => {
  const { conversationId: downstreamConversationId } = props.data.payload
  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)
  const isHitlActive = await downstreamCm.isHitlActive()
  if (!isHitlActive) {
    await _emitHitlStoppedEvent(props, downstreamConversationId)
    return consts.STOP_EVENT_HANDLING
  }

  const downstreamConversation = await props.client.getConversation({ id: downstreamConversationId })
  const upstreamConversationId = downstreamConversation.conversation.tags['upstream']
  if (!upstreamConversationId) {
    props.logger
      .withConversationId(downstreamConversationId)
      .error('Downstream conversation was not binded to upstream conversation')

    await _emitHitlStoppedEvent(props, downstreamConversationId)
    return consts.STOP_EVENT_HANDLING
  }

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)

  await Promise.allSettled([
    upstreamCm.respond({
      text: props.configuration.onHitlStoppedMessage ?? DEFAULT_HITL_STOPPED_MESSAGE,
    }),
    downstreamCm.setHitlInactive(conv.HITL_END_REASON.AGENT_CLOSED_TICKET),
    upstreamCm.setHitlInactive(conv.HITL_END_REASON.AGENT_CLOSED_TICKET),
  ])

  await _emitHitlStoppedEvent(props, downstreamConversationId, upstreamConversationId)
  return consts.STOP_EVENT_HANDLING
}

const _emitHitlStoppedEvent = async (
  props: bp.HookHandlerProps['before_incoming_event'],
  downstreamConversationId: string,
  upstreamConversationId?: string
) => {
  await props.client.createEvent({
    type: 'hitlStopped',
    payload: {
      downstreamConversationId,
    },
    conversationId: upstreamConversationId,
  })
}

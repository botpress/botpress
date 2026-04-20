import { DEFAULT_HITL_STOPPED_MESSAGE } from '../../../plugin.definition'
import * as configuration from '../../configuration'
import * as conv from '../../conv-manager'
import * as consts from '../consts'
import * as bp from '.botpress'

export const handleEvent: bp.HookHandlers['before_incoming_event']['hitl:hitlStopped'] = async (props) => {
  const { conversationId: downstreamConversationId } = props.data.payload

  const downstreamConversation = await props.conversations.hitl.hitl.getById({ id: downstreamConversationId })
  const downstreamCm = conv.ConversationManager.from(props, downstreamConversation)

  const isHitlActive = await downstreamCm.isHitlActive()
  if (!isHitlActive) {
    return consts.STOP_EVENT_HANDLING
  }

  const upstreamConversationId = downstreamConversation.tags.upstream
  if (!upstreamConversationId) {
    props.logger
      .withConversationId(downstreamConversationId)
      .error('Downstream conversation was not binded to upstream conversation')
    return consts.STOP_EVENT_HANDLING
  }

  const upstreamConversation = await props.conversations.hitl.hitl.getById({ id: upstreamConversationId })
  const upstreamCm = conv.ConversationManager.from(props, upstreamConversation)

  const sessionConfig = await configuration.retrieveSessionConfig({
    ...props,
    upstreamConversationId,
  })

  await Promise.allSettled([
    upstreamCm.maybeRespondText(sessionConfig.onHitlStoppedMessage, DEFAULT_HITL_STOPPED_MESSAGE),
    downstreamCm.setHitlInactive(conv.HITL_END_REASON.AGENT_CLOSED_TICKET),
    upstreamCm.setHitlInactive(conv.HITL_END_REASON.AGENT_CLOSED_TICKET),
  ])

  if (sessionConfig.flowOnHitlStopped) {
    // the bot will continue the conversation without the patient having to send another message
    await upstreamCm.continueWorkflow()
  }

  return consts.STOP_EVENT_HANDLING
}

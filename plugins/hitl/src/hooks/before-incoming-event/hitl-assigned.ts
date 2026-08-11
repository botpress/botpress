import * as conv from '../../conv-manager'
import * as consts from '../consts'
import { assignAgent } from '../operations'
import * as bp from '.botpress'

export const handleEvent: bp.HookHandlers['before_incoming_event']['hitl:hitlAssigned'] = async (props) => {
  const { conversationId: downstreamConversationId, userId: humanAgentUserId } = props.data.payload

  const downstreamConversation = await props.conversations.hitl.hitl.getById({ id: downstreamConversationId })
  const downstreamCm = conv.ConversationManager.from(props, downstreamConversation)

  const isHitlActive = await downstreamCm.isHitlActive()
  if (!isHitlActive) {
    // An inactive conversation that was never linked is not a downstream
    // conversation of this plugin (another installed integration may emit
    // hitl events); let the bot's own handlers see the event:
    return downstreamConversation.tags.upstream ? consts.STOP_EVENT_HANDLING : undefined
  }

  const upstreamConversationId = downstreamConversation.tags.upstream
  if (!upstreamConversationId) {
    props.logger
      .withConversationId(downstreamConversationId)
      .error('Downstream conversation was not bound to upstream conversation')
    return consts.STOP_EVENT_HANDLING
  }

  const upstreamConversation = await props.conversations.hitl.hitl.getById({ id: upstreamConversationId })
  if (!conv.isCurrentDownstreamConversation({ upstreamConversation, downstreamConversationId })) {
    return consts.STOP_EVENT_HANDLING
  }

  await assignAgent({
    props,
    downstreamConversation,
    humanAgentUserId,
  })

  return consts.STOP_EVENT_HANDLING
}

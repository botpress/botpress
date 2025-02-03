import * as conv from '../conv-manager'
import * as bp from '.botpress'

export const handleHitlStopped: bp.EventHandlers['hitl:hitlStopped'] = async (props) => {
  const { conversationId: downstreamConversationId } = props.event.payload
  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)
  const hitlState = await downstreamCm.getHitlState()
  if (!hitlState.hitlActive) {
    return
  }

  const downstreamConversation = await props.client.getConversation({ id: downstreamConversationId })
  const upstreamConversationId = downstreamConversation.conversation.tags['upstream']
  if (!upstreamConversationId) {
    console.error('downstream conversation was not binded to upstream conversation')
    return
  }

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)

  try {
    await props.actions.hitl.stopHitl({ conversationId: upstreamConversationId })
    await upstreamCm.respond({ text: 'Ticket was closed...' })
    await downstreamCm.respond({ text: 'Ticket was closed...' })
  } finally {
    await downstreamCm.setHitlState({ hitlActive: false })
    await upstreamCm.setHitlState({ hitlActive: false })
  }

  return
}

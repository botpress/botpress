import * as conv from '../conv-manager'
import * as bp from '.botpress'

export const stopHitl: bp.PluginProps['actions']['stopHitl'] = async (props) => {
  const { conversationId: upstreamConversationId } = props.input

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)
  const hitlState = await upstreamCm.getHitlState()
  if (!hitlState.hitlActive) {
    return {}
  }

  const upstreamConversation = await props.client.getConversation({ id: upstreamConversationId })
  const downstreamConversationId = upstreamConversation.conversation.tags['downstream']
  if (!downstreamConversationId) {
    console.error('Upstream conversation was not binded to downstream conversation')
    return {}
  }

  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)

  try {
    await upstreamCm.respond({ text: 'Closing ticket...' })
    await props.actions.hitl.stopHitl({ conversationId: downstreamConversationId })
    await upstreamCm.respond({ text: 'Ticket closed...' })
  } finally {
    await upstreamCm.setHitlState({ hitlActive: false })
    await downstreamCm.setHitlState({ hitlActive: false })
  }

  return {}
}

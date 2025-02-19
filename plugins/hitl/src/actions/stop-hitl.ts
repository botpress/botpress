import * as conv from '../conv-manager'
import * as msg from '../messages'
import * as bp from '.botpress'

export const stopHitl: bp.PluginProps['actions']['stopHitl'] = async (props) => {
  const { conversationId: upstreamConversationId } = props.input

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)
  const isHitlActive = await upstreamCm.isHitlActive()
  if (!isHitlActive) {
    return {}
  }

  const upstreamConversation = await props.client.getConversation({ id: upstreamConversationId })
  const downstreamConversationId = upstreamConversation.conversation.tags['downstream']
  if (!downstreamConversationId) {
    props.logger
      .withConversationId(upstreamConversationId)
      .error('Upstream conversation was not binded to downstream conversation')
    return {}
  }

  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)

  await downstreamCm.respond({ text: msg.userHitlCancelledMessage(props) })

  try {
    // Call stopHitl in the hitl integration (zendesk, etc.):
    await props.actions.hitl.stopHitl({ conversationId: downstreamConversationId })
  } finally {
    await Promise.all([upstreamCm.setHitlInactive(), downstreamCm.setHitlInactive()])
  }

  return {}
}

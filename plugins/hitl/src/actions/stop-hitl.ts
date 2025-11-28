import { DEFAULT_USER_HITL_CANCELLED_MESSAGE } from 'plugin.definition'
import * as configuration from '../configuration'
import * as conv from '../conv-manager'
import * as bp from '.botpress'

export const stopHitl: bp.PluginProps['actions']['stopHitl'] = async (props) => {
  const { conversationId: upstreamConversationId } = props.input

  const upstreamConversation = await props.conversations.hitl.hitl.getById({ id: upstreamConversationId })

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversation)
  const isHitlActive = await upstreamCm.isHitlActive()
  if (!isHitlActive) {
    return {}
  }

  const downstreamConversationId = upstreamConversation.tags.downstream
  if (!downstreamConversationId) {
    props.logger
      .withConversationId(upstreamConversationId)
      .error('Upstream conversation is not bound to a downstream conversation')
    return {}
  }

  const downstreamConversation = await props.conversations.hitl.hitl.getById({ id: downstreamConversationId })
  const downstreamCm = conv.ConversationManager.from(props, downstreamConversation)

  const sessionConfig = await configuration.retrieveSessionConfig({
    ...props,
    upstreamConversationId,
  })

  await downstreamCm.respond({
    type: 'text',
    text: sessionConfig.onUserHitlCancelledMessage?.length
      ? sessionConfig.onUserHitlCancelledMessage
      : DEFAULT_USER_HITL_CANCELLED_MESSAGE,
  })

  await Promise.allSettled([
    upstreamCm.setHitlInactive(conv.HITL_END_REASON.CLOSE_ACTION_CALLED),
    downstreamCm.setHitlInactive(conv.HITL_END_REASON.CLOSE_ACTION_CALLED),
  ])

  // Call stopHitl in the hitl integration (zendesk, etc.):
  await props.actions.hitl.stopHitl({ conversationId: downstreamConversationId })

  // TODO: possibly send the workflowContinue event here

  return {}
}

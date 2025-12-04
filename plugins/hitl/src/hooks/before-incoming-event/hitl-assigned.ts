import { DEFAULT_HUMAN_AGENT_ASSIGNED_MESSAGE } from '../../../plugin.definition'
import * as configuration from '../../configuration'
import * as conv from '../../conv-manager'
import { tryLinkWebchatUser } from '../../webchat'
import * as consts from '../consts'
import * as bp from '.botpress'

export const handleEvent: bp.HookHandlers['before_incoming_event']['hitl:hitlAssigned'] = async (props) => {
  const { conversationId: downstreamConversationId, userId: humanAgentUserId } = props.data.payload

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

  const humanAgentUser = await props.users.getById({ id: humanAgentUserId })
  const humanAgentName = humanAgentUser?.name?.length ? humanAgentUser.name : 'A Human Agent'

  await Promise.all([
    upstreamCm.maybeRespondText(sessionConfig.onHumanAgentAssignedMessage, DEFAULT_HUMAN_AGENT_ASSIGNED_MESSAGE),
    downstreamCm.setHumanAgent(humanAgentUserId, humanAgentName),
    upstreamCm.setHumanAgent(humanAgentUserId, humanAgentName),
    tryLinkWebchatUser(props, { downstreamUser: humanAgentUser, upstreamConversation, forceLink: true }),
  ])
  return consts.STOP_EVENT_HANDLING
}

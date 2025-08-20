import { DEFAULT_USER_HITL_CANCELLED_MESSAGE } from '../../../plugin.definition'
import * as configuration from '../../configuration'
import * as conv from '../../conv-manager'
import * as consts from '../consts'
import * as bp from '.botpress'

export const handleEvent: bp.HookHandlers['before_incoming_event']['humanAgentAssignedTimeout'] = async (props) => {
  const {
    conversationId: upstreamConversationId,
    payload: { downstreamConversationId },
  } = props.data

  if (!upstreamConversationId || !downstreamConversationId) {
    props.logger.error('Missing conversationId in event payload')
    return consts.STOP_EVENT_HANDLING
  }

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)
  const isAgentAlreadyAssigned = await upstreamCm.isHumanAgentAssigned()

  if (isAgentAlreadyAssigned) {
    props.logger.info('Human agent assigned timeout event ignored because the agent is already assigned')
    return consts.STOP_EVENT_HANDLING
  }

  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)
  const isHitlActive = (await upstreamCm.isHitlActive()) && (await downstreamCm.isHitlActive())

  if (!isHitlActive) {
    props.logger.info('Human agent assigned timeout event ignored because hitl is inactive')
    return consts.STOP_EVENT_HANDLING
  }

  const sessionConfig = await configuration.retrieveSessionConfig({
    ...props,
    upstreamConversationId,
  })

  if (!_isTimeoutElapsed(props, sessionConfig)) {
    props.logger.info('Human agent assigned timeout event ignored because the timeout has not lapsed yet')
    return consts.STOP_EVENT_HANDLING
  }

  await _handleTimeout(props, upstreamCm, downstreamCm, sessionConfig)

  if (sessionConfig.flowOnHitlStopped) {
    // the bot will continue the conversation without the patient having to send another message
    await upstreamCm.continueWorkflow()
  }

  return consts.STOP_EVENT_HANDLING
}

const _isTimeoutElapsed = (
  props: bp.HookHandlerProps['before_incoming_event'],
  sessionConfig: bp.configuration.Configuration
): boolean => {
  if (!_isTimeoutEnabled(sessionConfig)) {
    props.logger.info('Human agent assigned timeout is not enabled')
    return false
  }

  const now = Date.now()
  const timeWhenCreated = new Date(props.data.payload.sessionStartedAt).getTime()
  const elapsedSeconds = (now - timeWhenCreated) / 1000
  const timeoutSeconds = sessionConfig.agentAssignedTimeoutSeconds ?? 0

  return elapsedSeconds >= timeoutSeconds
}

const _isTimeoutEnabled = (sessionConfig: bp.configuration.Configuration): boolean =>
  !!sessionConfig.agentAssignedTimeoutSeconds

const _handleTimeout = async (
  props: bp.HookHandlerProps['before_incoming_event'],
  upstreamCm: conv.ConversationManager,
  downstreamCm: conv.ConversationManager,
  sessionConfig: bp.configuration.Configuration
) => {
  await downstreamCm.respond({
    // TODO: We might want to add a custom message for the human agent.
    type: 'text',
    text: sessionConfig.onUserHitlCancelledMessage?.trim()?.length
      ? sessionConfig.onUserHitlCancelledMessage
      : DEFAULT_USER_HITL_CANCELLED_MESSAGE,
  })

  await Promise.allSettled([
    upstreamCm.setHitlInactive(conv.HITL_END_REASON.AGENT_ASSIGNMENT_TIMEOUT),
    downstreamCm.setHitlInactive(conv.HITL_END_REASON.AGENT_ASSIGNMENT_TIMEOUT),
  ])

  props.logger.withConversationId(upstreamCm.conversationId).info('HITL session ended due to agent assignment timeout')
  props.logger
    .withConversationId(downstreamCm.conversationId)
    .info('HITL session ended due to agent assignment timeout')

  // Call stopHitl in the hitl integration (zendesk, etc.):
  await props.actions.hitl.stopHitl({ conversationId: downstreamCm.conversationId })

  if (sessionConfig.onAgentAssignedTimeoutMessage?.trim()?.length) {
    await upstreamCm.respond({
      type: 'text',
      text: sessionConfig.onAgentAssignedTimeoutMessage,
    })
  }
}

import { DEFAULT_AGENT_ASSIGNED_TIMEOUT_MESSAGE, DEFAULT_USER_HITL_CANCELLED_MESSAGE } from '../../../plugin.definition'
import * as conv from '../../conv-manager'
import * as consts from '../consts'
import * as bp from '.botpress'

export const handleEvent: bp.HookHandlers['before_incoming_event']['humanAgentAssignedTimeout'] = async (props) => {
  const {
    conversationId: upstreamConversationId,
    payload: { downstreamConversationId },
  } = props.data

  if (!_isTimeoutElapsed(props)) {
    props.logger.info('Human agent assigned timeout event ignored because the timeout has not lapsed yet')
    return consts.LET_BOT_HANDLE_EVENT
  }

  if (!upstreamConversationId || !downstreamConversationId) {
    props.logger.error('Missing conversationId in event payload')
    return consts.LET_BOT_HANDLE_EVENT
  }

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)
  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)
  const isAgentAlreadyAssigned = await _isAgentAlreadyAssigned(upstreamCm, downstreamCm)

  if (isAgentAlreadyAssigned) {
    props.logger.info('Human agent assigned timeout event ignored because the agent is already assigned')
    return consts.LET_BOT_HANDLE_EVENT
  }

  await _handleTimeout(props, upstreamCm, downstreamCm)
  return consts.LET_BOT_HANDLE_EVENT
}

const _isTimeoutElapsed = (props: bp.HookHandlerProps['before_incoming_event']): boolean => {
  if (!_isTimeoutEnabled(props)) {
    props.logger.info('Human agent assigned timeout is not enabled')
    return false
  }

  const now = Date.now()
  const timeWhenCreated = new Date(props.data.payload.sessionStartedAt).getTime()
  const elapsedSeconds = (now - timeWhenCreated) / 1000
  const timeoutSeconds = props.configuration.agentAssignedTimeoutSeconds ?? 0

  return elapsedSeconds >= timeoutSeconds
}

const _isTimeoutEnabled = (props: bp.HookHandlerProps['before_incoming_event']): boolean =>
  !!props.configuration.agentAssignedTimeoutSeconds

const _isAgentAlreadyAssigned = async (
  upstreamCm: conv.ConversationManager,
  downstreamCm: conv.ConversationManager
): Promise<boolean> => {
  const isHumanAgentAssigned = await upstreamCm.isHumanAgentAssigned()

  if (isHumanAgentAssigned) {
    return true
  }

  const isHitlActive = (await upstreamCm.isHitlActive()) && (await downstreamCm.isHitlActive())

  if (!isHitlActive) {
    // If the HITL session is not active, we don't need to check whether the
    // human agent is assigned and we should not process the event.
    return true
  }

  return false
}

const _handleTimeout = async (
  props: bp.HookHandlerProps['before_incoming_event'],
  upstreamCm: conv.ConversationManager,
  downstreamCm: conv.ConversationManager
) => {
  await Promise.allSettled([
    upstreamCm.respond({
      text: props.configuration.onAgentAssignedTimeoutMessage ?? DEFAULT_AGENT_ASSIGNED_TIMEOUT_MESSAGE,
    }),
    downstreamCm.respond({
      // TODO: We might want to add a custom message for the human agent.
      text: props.configuration.onUserHitlCancelledMessage ?? DEFAULT_USER_HITL_CANCELLED_MESSAGE,
    }),
  ])

  props.logger.withConversationId(upstreamCm.conversationId).info('HITL session ended due to agent assignment timeout')
  props.logger
    .withConversationId(downstreamCm.conversationId)
    .info('HITL session ended due to agent assignment timeout')

  try {
    // Call stopHitl in the hitl integration (zendesk, etc.):
    await props.actions.hitl.stopHitl({ conversationId: downstreamCm.conversationId })
  } finally {
    await Promise.all([
      upstreamCm.setHitlInactive(conv.HITL_END_REASON.AGENT_ASSIGNMENT_TIMEOUT),
      downstreamCm.setHitlInactive(conv.HITL_END_REASON.AGENT_ASSIGNMENT_TIMEOUT),
    ])
  }
}

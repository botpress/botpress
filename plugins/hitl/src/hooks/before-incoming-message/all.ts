import * as client from '@botpress/client'
import {
  DEFAULT_INCOMPATIBLE_MSGTYPE_MESSAGE,
  DEFAULT_USER_HITL_CANCELLED_MESSAGE,
  DEFAULT_USER_HITL_CLOSE_COMMAND,
  DEFAULT_USER_HITL_COMMAND_MESSAGE,
} from 'plugin.definition'
import * as conv from '../../conv-manager'
import * as consts from '../consts'
import * as bp from '.botpress'

export const handleMessage: bp.HookHandlers['before_incoming_message']['*'] = async (props) => {
  const { conversation } = await props.client.getConversation({
    id: props.data.conversationId,
  })
  const { integration } = conversation
  if (integration === props.interfaces.hitl.name) {
    return await _handleDownstreamMessage(props, conversation)
  }
  return await _handleUpstreamMessage(props, conversation)
}

const _handleDownstreamMessage = async (
  props: bp.HookHandlerProps['before_incoming_message'],
  downstreamConversation: client.Conversation
) => {
  const downstreamCm = conv.ConversationManager.from(props, props.data.conversationId)
  const isHitlActive = await downstreamCm.isHitlActive()
  if (!isHitlActive) {
    return consts.STOP_EVENT_HANDLING // we don't want the bot to chat with the human agent in a closed ticket
  }

  if (props.data.type !== 'text') {
    props.logger.with(props.data).error('Downstream conversation received a non-text message')
    await downstreamCm.respond({
      text: props.configuration.onIncompatibleMsgTypeMessage ?? DEFAULT_INCOMPATIBLE_MSGTYPE_MESSAGE,
    })
    return consts.STOP_EVENT_HANDLING
  }

  const upstreamConversationId = downstreamConversation.tags['upstream']

  if (!upstreamConversationId) {
    return await _abortHitlSession({
      cm: downstreamCm,
      internalReason: 'Downstream conversation was not bound to upstream conversation',
      reasonShownToUser: 'Something went wrong, you are not connected to a human agent...',
      props,
    })
  }

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)

  props.logger.withConversationId(downstreamConversation.id).info('Sending message to upstream')
  const text: string = props.data.payload.text
  await upstreamCm.respond({ text })
  return consts.STOP_EVENT_HANDLING
}

const _handleUpstreamMessage = async (
  props: bp.HookHandlerProps['before_incoming_message'],
  upstreamConversation: client.Conversation
) => {
  const upstreamCm = conv.ConversationManager.from(props, props.data.conversationId)
  const isHitlActive = await upstreamCm.isHitlActive()
  if (!isHitlActive) {
    return consts.LET_BOT_HANDLE_EVENT
  }

  if (props.data.type !== 'text') {
    props.logger.with(props.data).error('Upstream conversation received a non-text message')
    await upstreamCm.respond({ text: 'Sorry, I can only handle text messages for now. Please try again.' })
    return consts.STOP_EVENT_HANDLING
  }

  const { user: upstreamUser } = await props.client.getUser({ id: props.data.userId })

  const downstreamConversationId = upstreamConversation.tags['downstream']
  if (!downstreamConversationId) {
    return await _abortHitlSession({
      cm: upstreamCm,
      internalReason: 'Upstream conversation was not bound to downstream conversation',
      reasonShownToUser: 'Something went wrong, you are not connected to a human agent...',
      props,
    })
  }

  const downstreamUserId = upstreamUser.tags['downstream']
  if (!downstreamUserId) {
    return await _abortHitlSession({
      cm: upstreamCm,
      internalReason: 'Upstream user was not bound to downstream user',
      reasonShownToUser: 'Something went wrong, you are not connected to a human agent...',
      props,
    })
  }

  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)

  if (_isHitlCloseCommand(props)) {
    await _handleHitlCloseCommand(props, { downstreamCm, upstreamCm })
    return consts.STOP_EVENT_HANDLING
  }

  props.logger.withConversationId(upstreamConversation.id).info('Sending message to downstream')
  await downstreamCm.respond({
    userId: downstreamUserId,
    text: props.data.payload.text,
  })

  return consts.STOP_EVENT_HANDLING
}

const _abortHitlSession = async ({
  cm,
  internalReason,
  reasonShownToUser,
  props,
}: {
  cm: conv.ConversationManager
  internalReason: string
  reasonShownToUser: string
  props: bp.HookHandlerProps['before_incoming_message']
}) => {
  props.logger.withConversationId(cm.conversationId).error(internalReason)

  await cm.abortHitlSession(reasonShownToUser)

  return consts.STOP_EVENT_HANDLING
}

const _isHitlCloseCommand = (props: bp.HookHandlerProps['before_incoming_message']) =>
  props.data.payload.text.trim().startsWith(props.configuration.userHitlCloseCommand ?? DEFAULT_USER_HITL_CLOSE_COMMAND)

const _handleHitlCloseCommand = async (
  props: bp.HookHandlerProps['before_incoming_message'],
  { downstreamCm, upstreamCm }: { downstreamCm: conv.ConversationManager; upstreamCm: conv.ConversationManager }
) => {
  await Promise.allSettled([
    downstreamCm.respond({
      text: props.configuration.onUserHitlCancelledMessage ?? DEFAULT_USER_HITL_CANCELLED_MESSAGE,
    }),
    upstreamCm.respond({
      text: props.configuration.onUserHitlCloseMessage ?? DEFAULT_USER_HITL_COMMAND_MESSAGE,
    }),
  ])

  props.logger
    .withConversationId(upstreamCm.conversationId)
    .info('User ended the HITL session using the termination command')
  props.logger
    .withConversationId(downstreamCm.conversationId)
    .info('User ended the HITL session using the termination command')

  try {
    // Call stopHitl in the hitl integration (zendesk, etc.):
    await props.actions.hitl.stopHitl({ conversationId: downstreamCm.conversationId })
  } finally {
    await Promise.all([
      upstreamCm.setHitlInactive(conv.HITL_END_REASON.PATIENT_USED_TERMINATION_COMMAND),
      downstreamCm.setHitlInactive(conv.HITL_END_REASON.PATIENT_USED_TERMINATION_COMMAND),
    ])
  }
}

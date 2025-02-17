import * as client from '@botpress/client'
import * as conv from '../conv-manager'
import * as bp from '.botpress'
import { DEFAULT_INCOMPATIBLE_MSGTYPE_MESSAGE } from 'plugin.definition'

export const handleMessage: NonNullable<bp.HookHandlers['before_incoming_message']['*']> = async (props) => {
  const { conversation } = await props.client.getConversation({
    id: props.data.conversationId,
  })
  const { integration } = conversation
  if (integration === props.interfaces.hitl.name) {
    return await _handleDownstreamMessage(props, conversation)
  }
  return await _handleUpstreamMessage(props, conversation)
}

const LET_BOT_HANDLE_MESSAGE = { stop: false } as const // let the message propagate to the bot
const STOP_MESSAGE_HANDLING = { stop: true } as const // prevent the message from propagating to the bot

const _handleDownstreamMessage = async (
  props: bp.HookHandlerProps['before_incoming_message'],
  downstreamConversation: client.Conversation
) => {
  const downstreamCm = conv.ConversationManager.from(props, props.data.conversationId)
  const isHitlActive = await downstreamCm.isHitlActive()
  if (!isHitlActive) {
    return LET_BOT_HANDLE_MESSAGE
  }

  if (props.data.type !== 'text') {
    props.logger.with(props.data).error('Downstream conversation received a non-text message')
    await downstreamCm.respond({
      text: props.configuration.onIncompatibleMsgTypeMessage ?? DEFAULT_INCOMPATIBLE_MSGTYPE_MESSAGE,
    })
    return STOP_MESSAGE_HANDLING
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
  return STOP_MESSAGE_HANDLING
}

const _handleUpstreamMessage = async (
  props: bp.HookHandlerProps['before_incoming_message'],
  upstreamConversation: client.Conversation
) => {
  const upstreamCm = conv.ConversationManager.from(props, props.data.conversationId)
  const isHitlActive = await upstreamCm.isHitlActive()
  if (!isHitlActive) {
    return LET_BOT_HANDLE_MESSAGE
  }

  if (props.data.type !== 'text') {
    props.logger.with(props.data).error('Upstream conversation received a non-text message')
    await upstreamCm.respond({ text: 'Sorry, I can only handle text messages for now. Please try again.' })
    return STOP_MESSAGE_HANDLING
  }

  const text: string = props.data.payload.text
  if (text.trim().startsWith('/')) {
    return LET_BOT_HANDLE_MESSAGE // TODO: remove this
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

  props.logger.withConversationId(upstreamConversation.id).info('Sending message to downstream')
  await downstreamCm.respond({
    userId: downstreamUserId,
    text,
  })

  return STOP_MESSAGE_HANDLING
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
  await props.actions.hitl.stopHitl({
    conversationId: cm.conversationId,
    reason: 'cancel',
  })

  return STOP_MESSAGE_HANDLING
}

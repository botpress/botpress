import * as client from '@botpress/client'
import * as conv from '../conv-manager'
import * as bp from '.botpress'

const CONTINUE_MESSAGE = { stop: false } // let the message propagate to the bot
const STOP_MESSAGE = { stop: true } // prevent the message from propagating to the bot

const handleDownstreamMessage = async (
  props: bp.HookHandlerProps['before_incoming_message'],
  downstreamConversation: client.Conversation
) => {
  const downstreamCm = conv.ConversationManager.from(props, props.data.conversationId)
  const hitlState = await downstreamCm.getHitlState()
  if (!hitlState.hitlActive) {
    return CONTINUE_MESSAGE
  }

  if (props.data.type !== 'text') {
    // TODO: find out what to do here
    return STOP_MESSAGE
  }

  const text: string = props.data.payload.text
  if (text.trim().startsWith('/')) {
    return CONTINUE_MESSAGE // TODO: remove this
  }

  const upstreamConversationId = downstreamConversation.tags['upstream']
  if (!upstreamConversationId) {
    console.error('Downstream conversation was not binded to upstream conversation')
    await downstreamCm.respond({ text: 'Something went wrong, you are not connected to a patient...' })
    // TODO: maybe disable hitl before returning
    return CONTINUE_MESSAGE
  }

  const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)

  console.info('Sending message to upstream')
  await upstreamCm.respond({ text })
  return STOP_MESSAGE
}

const handleUpstreamMessage = async (
  props: bp.HookHandlerProps['before_incoming_message'],
  upstreamConversation: client.Conversation
) => {
  const upstreamCm = conv.ConversationManager.from(props, props.data.conversationId)
  const hitlState = await upstreamCm.getHitlState()
  if (!hitlState.hitlActive) {
    return CONTINUE_MESSAGE
  }

  if (props.data.type !== 'text') {
    // TODO: find out what to do here
    return STOP_MESSAGE
  }

  const text: string = props.data.payload.text
  if (text.trim().startsWith('/')) {
    return CONTINUE_MESSAGE // TODO: remove this
  }

  const { user: upstreamUser } = await props.client.getUser({ id: props.data.userId })

  const downstreamConversationId = upstreamConversation.tags['downstream']
  if (!downstreamConversationId) {
    console.error('Upstream conversation was not binded to downstream conversation')
    await upstreamCm.respond({ text: 'Something went wrong, you are not connected to a human agent...' })
    // TODO: maybe disable hitl before returning
    return CONTINUE_MESSAGE
  }

  const downstreamUserId = upstreamUser.tags['downstream']
  if (!downstreamUserId) {
    console.error('Upstream user was not binded to downstream user')
    await upstreamCm.respond({ text: 'Something went wrong, you are not connected to a human agent...' })
    // TODO: maybe disable hitl before returning
    return CONTINUE_MESSAGE
  }

  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)

  console.info('Sending message to downstream')
  await downstreamCm.respond({
    userId: downstreamUserId,
    text,
  })

  return STOP_MESSAGE
}

export const handleMessage: NonNullable<bp.HookHandlers['before_incoming_message']['*']> = async (props) => {
  const { conversation } = await props.client.getConversation({
    id: props.data.conversationId,
  })
  const { integration } = conversation
  if (integration === props.interfaces.hitl.name) {
    return await handleDownstreamMessage(props, conversation)
  }
  return await handleUpstreamMessage(props, conversation)
}

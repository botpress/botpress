import * as sdk from '@botpress/sdk'
import * as summaryUpdater from './summaryUpdater'
import * as updateScheduler from './summaryUpdateScheduler'
import * as types from './types'
import * as bp from '.botpress'

type CommonProps = types.CommonProps

const plugin = new bp.Plugin({
  actions: {},
})

// #region message handlers
plugin.on.afterIncomingMessage('*', async (props) => {
  const { conversation } = await props.client.getConversation({ id: props.data.conversationId })
  const { message_count } = await _onNewMessage({ ...props, conversation })

  if (updateScheduler.isTimeToUpdate(message_count)) {
    props.client.createEvent({ payload: {}, type: 'updateSummary', conversationId: props.data.conversationId })
  }

  return undefined
})

plugin.on.afterOutgoingMessage('*', async (props) => {
  const { conversation } = await props.client.getConversation({ id: props.data.message.conversationId })
  await _onNewMessage({ ...props, conversation })
  return undefined
})

type OnNewMessageProps = CommonProps & {
  conversation: bp.ClientOutputs['getConversation']['conversation']
}
const _onNewMessage = async (
  props: OnNewMessageProps
): Promise<{ message_count: number; participant_count: number }> => {
  const message_count = props.conversation.tags.message_count ? parseInt(props.conversation.tags.message_count) + 1 : 1

  const participant_count = await props.client
    .listParticipants({ id: props.conversation.id })
    .then(({ participants }) => participants.length)

  const tags = {
    message_count: message_count.toString(),
    participant_count: participant_count.toString(),
  }

  await props.client.updateConversation({
    id: props.conversation.id,
    tags,
  })
  return { message_count, participant_count }
}
// #endregion

// #region events
plugin.on.event('updateSummary', async (props) => {
  const messages = await props.client.listMessages({ conversationId: props.event.conversationId })
  const newMessages: string[] = messages.messages.map((message) => message.payload.text)
  if (!props.event.conversationId) {
    throw new sdk.RuntimeError(`The conversationId cannot be null when calling the event '${props.event.type}'`)
  }
  const conversation = await props.client.getConversation({ id: props.event.conversationId })

  await summaryUpdater.updateTitleAndSummary({
    ...props,
    conversation: conversation.conversation,
    messages: newMessages,
  })
})

// #endregion

export default plugin

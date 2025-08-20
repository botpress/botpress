import * as sdk from '@botpress/sdk'
import { isBrowser } from 'browser-or-node'
import * as updateScheduler from './summaryUpdateScheduler'
import * as summaryUpdater from './tagsUpdater'
import * as types from './types'
import * as bp from '.botpress'

type CommonProps = types.CommonProps

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.afterIncomingMessage('*', async (props) => {
  if (isBrowser) {
    return
  }
  const { conversation } = await props.client.getConversation({ id: props.data.conversationId })
  const { message_count } = await _onNewMessage({ ...props, conversation })

  if (props.configuration.aiEnabled && updateScheduler.isTimeToUpdate(message_count)) {
    await props.events.updateAiInsight.withConversationId(props.data.conversationId).emit({})
  }

  return undefined
})

plugin.on.afterOutgoingMessage('*', async (props) => {
  if (isBrowser) {
    return
  }
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

plugin.on.event('updateAiInsight', async (props) => {
  if (isBrowser) {
    props.logger.error('This event is not supported by the browser')
    return
  }
  const firstMessagePage = await props.client
    .listMessages({ conversationId: props.event.conversationId })
    .then((res) => res.messages)

  if (!props.event.conversationId) {
    throw new sdk.RuntimeError(`The conversationId cannot be null when calling the event '${props.event.type}'`)
  }
  const conversation = await props.client.getConversation({ id: props.event.conversationId })

  await summaryUpdater.updateTitleAndSummary({
    ...props,
    conversation: conversation.conversation,
    messages: firstMessagePage,
  })
})

export default plugin

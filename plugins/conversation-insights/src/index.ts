import * as sdk from '@botpress/sdk'
import * as updateScheduler from './summaryUpdateScheduler'
import * as bp from '.botpress'
import * as summaryUpdater from './conversationTagsUpdater'

const plugin = new bp.Plugin({
  actions: {},
})

// TODO: generate a type for CommonProps in the CLI / SDK
export type CommonProps =
  | bp.HookHandlerProps['after_incoming_message']
  | bp.HookHandlerProps['after_outgoing_message']
  | bp.EventHandlerProps

plugin.on.afterIncomingMessage('*', async (props) => {
  const { conversation } = await props.client.getConversation({ id: props.data.conversationId })
  const { message_count } = await _onNewMessage({ ...props, conversation })

  if (updateScheduler.isTimeToUpdate(message_count)) {
    await createUpdateWorkflowForConversation({ ...props, conversationId: props.data.conversationId })
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

// #region workflows

type WorkflowCreationProps = CommonProps & { conversationId: string }
const createUpdateWorkflowForConversation = async (props: WorkflowCreationProps) => {
  const messages = await props.client.listMessages({ conversationId: props.conversationId })
  const newMessages: string[] = messages.messages.map((message) => message.payload.text)
  props.workflows.updateSummary.startNewInstance({
    input: { messages: newMessages },
    conversationId: props.conversationId,
  })
}

plugin.on.workflowStart('updateSummary', async (props) => {
  if (!props.conversation) throw new sdk.RuntimeError('The conversation id cannot be null')
  props.logger.info(`The workflow '${props.workflow.id}' has been started`)
})

plugin.on.workflowContinue('updateSummary', async (props) => {
  if (!props.conversation) throw new sdk.RuntimeError('The conversation id cannot be null')
  await summaryUpdater.updateTitleAndSummary({
    ...props,
    conversation: props.conversation,
    messages: props.workflow.input.messages,
  })

  props.workflow.setCompleted()
  props.logger.info(`The workflow '${props.workflow.id}' has been completed`)
})

plugin.on.workflowTimeout('updateSummary', async (props) => {
  console.log('workflow timed out')
  props.workflow.setFailed({ failureReason: 'Unknown reason' })
})

// endregion

export default plugin

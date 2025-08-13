import * as sdk from '@botpress/sdk'
import * as gen from './generate-content'
import * as summarizer from './summary-prompt'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

// TODO: generate a type for CommonProps in the CLI / SDK
type CommonProps =
  | bp.HookHandlerProps['after_incoming_message']
  | bp.HookHandlerProps['after_outgoing_message']
  | bp.EventHandlerProps

plugin.on.afterIncomingMessage('*', async (props) => {
  const { conversation } = await props.client.getConversation({ id: props.data.conversationId })
  await _onNewMessage({ ...props, conversation, isDirty: true })

  await createWorkflowForConversation({ ...props, conversationId: props.data.conversationId })

  return undefined
})

plugin.on.afterOutgoingMessage('*', async (props) => {
  const { conversation } = await props.client.getConversation({ id: props.data.message.conversationId })
  await _onNewMessage({ ...props, conversation, isDirty: false })
  return undefined
})

type OnNewMessageProps = CommonProps & {
  conversation: bp.ClientOutputs['getConversation']['conversation']
  isDirty: boolean
}
const _onNewMessage = async (props: OnNewMessageProps) => {
  const message_count = props.conversation.tags.message_count ? parseInt(props.conversation.tags.message_count) + 1 : 1

  const participant_count = await props.client
    .listParticipants({ id: props.conversation.id })
    .then(({ participants }) => participants.length)

  const tags = {
    message_count: message_count.toString(),
    participant_count: participant_count.toString(),
    isDirty: props.isDirty ? 'true' : 'false',
  }

  await props.client.updateConversation({
    id: props.conversation.id,
    tags,
  })
}

// #region workflows

type WorkflowCreationProps = CommonProps & { conversationId: string }
const createWorkflowForConversation = async (props: WorkflowCreationProps) => {
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
  await _updateTitleAndSummary({
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

type UpdateTitleAndSummaryProps = CommonProps & {
  conversation: bp.MessageHandlerProps['conversation']
  messages: string[]
  workflow: bp.WorkflowHandlerProps['updateSummary']['workflow']
}
const _updateTitleAndSummary = async (props: UpdateTitleAndSummaryProps) => {
  const prompt = summarizer.createPrompt({
    messages: props.messages,
    model: props.configuration.model,
    context: { previousTitle: props.conversation.tags.title, previousSummary: props.conversation.tags.summary },
  })
  let llmOutput = await props.actions.llm.generateContent(prompt)
  let parsed = gen.parseLLMOutput(llmOutput)

  let attempt = 0
  const maxRetries = 3

  while (!parsed.success && attempt < maxRetries) {
    props.logger.debug(`Attempt ${attempt + 1}: The LLM output did not respect the schema.`, parsed.json)
    attempt++
    const retryPrompt = summarizer.createPrompt({
      messages: props.messages,
      model: props.configuration.model,
      context: { previousTitle: props.conversation.tags.title, previousSummary: props.conversation.tags.summary },
    })
    llmOutput = await props.actions.llm.generateContent(retryPrompt)
    parsed = gen.parseLLMOutput(llmOutput)
  }

  if (!parsed.success) {
    props.logger.debug('The LLM output did not respect the schema after retries.', parsed.json)
    props.workflow.setFailed({ failureReason: 'Could not parse LLM title and summary output after retries' })
    return
  }

  const json = parsed.json
  props.logger.debug('received llm output', llmOutput.choices)

  await props.client.updateConversation({
    id: props.conversation.id,
    tags: {
      title: json.title,
      summary: json.summary,
      isDirty: 'false',
    },
  })
}
// endregion

export default plugin

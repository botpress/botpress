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
  console.log('received message in plugin')

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

const createWorkflowForAllConversations = async (props: CommonProps) => {
  const conversations = await props.client.listConversations({ tags: { isDirty: 'true' } })

  for (const conversation of conversations.conversations) {
    await createWorkflowForConversation({ ...props, conversationId: conversation.id })
  }
}

type WorkflowCreationProps = CommonProps & { conversationId: string }
const createWorkflowForConversation = async (props: WorkflowCreationProps) => {
  const messages = await props.client.listMessages({ conversationId: props.conversationId })
  const newMessages: string[] = messages.messages.map((message) => message.payload.text)
  await props.client.createWorkflow({
    input: { messages: newMessages },
    name: 'updateWithWorkflow',
    status: 'pending',
    conversationId: props.conversationId,
  })
}

plugin.on.workflowStart('updateWithWorkflow', async (props) => {
  if (!props.conversation) throw new sdk.RuntimeError('The conversation id cannot be null')
  console.log('workflow started')
})

plugin.on.workflowContinue('updateWithWorkflow', async (props) => {
  if (!props.conversation) throw new sdk.RuntimeError('The conversation id cannot be null')
  console.log('continuing workflow')
  await _updateTitleAndSummary({
    ...props,
    conversation: props.conversation,
    messages: props.workflow.input.messages,
  })

  props.workflow.setCompleted()
  console.log('completed')
})

plugin.on.workflowTimeout('updateWithWorkflow', async (props) => {
  console.log('workflow timed out')
  props.workflow.setFailed({ failureReason: 'Unknown reason' })
})

type UpdateTitleAndSummaryProps = CommonProps & {
  conversation: bp.MessageHandlerProps['conversation']
  messages: string[]
  workflow: bp.WorkflowHandlerProps['updateWithWorkflow']['workflow']
}
const _updateTitleAndSummary = async (props: UpdateTitleAndSummaryProps) => {
  props.client._inner.config.headers['x-workspace-id'] = '11111111-1111-1111-aaaa-111111111111'

  const prompt = summarizer.createPrompt({
    messages: props.messages,
    model: props.configuration.model,
    context: { previousTitle: props.conversation.tags.title, previousSummary: props.conversation.tags.summary },
  })
  console.log(prompt)
  const llmOutput = await props.actions.llm.generateContent(prompt)
  const { success, json } = gen.parseLLMOutput(llmOutput)

  console.log('received llm output', json)

  //TODO add retries

  if (!success) {
    props.logger.debug('The LLM output did not respect the schema.', json)
    props.workflow.setFailed({ failureReason: 'Could not parse LLM title and summary output' })
  }

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

plugin.on.event('updateTitleAndSummary', async (props) => {
  console.log('recurring event was called on the plugin')
})

export default plugin

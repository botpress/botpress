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
  return undefined
})

plugin.on.afterOutgoingMessage('*', async (props) => {
  const { conversation } = await props.client.getConversation({ id: props.data.message.conversationId })
  await _onNewMessage({ ...props, conversation, isDirty: false })
  return undefined
})

plugin.on.event('updateTitleAndSummary', async (props) => {
  const conversations = await props.client.listConversations({ tags: { isDirty: 'true' } })

  for (const conversation of conversations.conversations) {
    const messages = await props.client.listMessages({ conversationId: conversation.id })
    const newMessages = messages.messages.map((message) => message.payload.text)
    await _updateTitleAndSummary({ ...props, conversationId: conversation.id, messages: newMessages })
  }
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

type UpdateTitleAndSummaryProps = CommonProps & {
  conversationId: string
  messages: string[]
}
const _updateTitleAndSummary = async (props: UpdateTitleAndSummaryProps) => {
  await props.client.updateConversation({
    id: props.conversationId,
    tags: {
      // TODO: use the cognitive client / service to generate a title and summary
      title: 'The conversation title!',
      summary: 'This is normally where the conversation summary would be.',
      isDirty: 'false',
    },
  })
}

export default plugin

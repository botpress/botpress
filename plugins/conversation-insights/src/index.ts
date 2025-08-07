import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

const stubTags = {
  cost: '345',
  topics: 'rats',
  title: 'The conversation title!',
  summary: 'This is normally where the conversation summary would be.',
}

plugin.on.afterIncomingMessage('*', async (props) => {
  await _newMessage({
    ...props,
    conversation: { id: props.data.conversationId, tags: props.data.tags },
    userId: props.data.userId,
  })

  props.states.conversation.dirty.set(props.data.conversationId, { hasHadNewMessagesSinceRefresh: true })

  return { data: props.data }
})

plugin.on.afterOutgoingMessage('*', async (props) => {
  const conversation = await props.client.getConversation({ id: props.data.message.conversationId })
  await _newMessage({ ...props, conversation: conversation.conversation, userId: props.data.message.userId })

  return { data: { message: props.data.message } }
})

plugin.on.event('updateTitleAndSummary', async (props) => {
  const conversations = await props.client.listConversations({
    tags: { dirty: 'true' },
  })

  for (const conversation of conversations.conversations) {
    const messages = props.client.listMessages({ conversationId: conversation.id })
    const newMessages = (await messages).messages.map((message) => message.payload.text)

    await _updateTitleAndSummary({ client: props.client }, newMessages)
    await props.states.conversation.dirty.set(conversation.id, { hasHadNewMessagesSinceRefresh: false })
  }
})

const _newMessage = async (props: {
  conversation: {
    id: bp.MessageHandlerProps['conversation']['id']
    tags: bp.MessageHandlerProps['conversation']['tags']
  }
  states: bp.MessageHandlerProps['states']
  userId: bp.MessageHandlerProps['user']['id']
  client: bp.MessageHandlerProps['client']
  logger: bp.MessageHandlerProps['logger']
}) => {
  const message_count = props.conversation.tags.message_count ? parseInt(props.conversation.tags.message_count) + 1 : 1

  const participantsState = await props.states.conversation.participants.getOrSet(props.conversation.id, {
    ids: [],
  })

  let updatedParticipants = participantsState.ids
  const senderId = props.userId

  if (!updatedParticipants.includes(senderId)) {
    updatedParticipants = [...updatedParticipants, senderId]
    await props.states.conversation.participants.set(props.conversation.id, {
      ids: updatedParticipants,
    })
  }

  const participant_count = updatedParticipants.length.toString()

  const tags = { message_count: message_count.toString(), participant_count, ...stubTags }

  props.client.updateConversation({
    id: props.conversation.id,
    tags,
  })
}

const _updateTitleAndSummary = async (_props: { client: bp.MessageHandlerProps['client'] }, messages: string[]) => {
  //TODO: use a workflow that calls the cognitive service
  console.log(`updated the title and summary with messages ${messages}`)
}

export default plugin

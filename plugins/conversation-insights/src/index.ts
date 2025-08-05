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

plugin.on.message('*', async (props) => {
  await _newMessage(props)

  await props.client.createMessage({
    conversationId: props.conversation.id,
    payload: { text: 'received your message' },
    type: 'text',
    tags: {},
    userId: props.ctx.botId,
  })

  const unreads = await props.states.conversation.unreadMessages.getOrSet(props.conversation.id, { ids: [] })
  unreads.ids = unreads.ids ? unreads.ids : []
  props.states.conversation.unreadMessages.set(props.conversation.id, { ids: [...unreads.ids, props.message.id] })
})

plugin.on.afterOutgoingMessage('*', async (props) => {
  const conversation = await props.client.getConversation({ id: props.data.message.conversationId })
  const user = await props.client.getUser({ id: props.data.message.userId })
  await _newMessage({ ...props, conversation: conversation.conversation, user: user.user })

  return { data: { message: props.data.message } }
})

plugin.on.event('updateTitleAndSummary', async (props) => {
  console.log('called update event')
  const conversations = await props.client.listConversations({})

  for (const conversation of conversations.conversations) {
    const newMessageIds = (await props.states.conversation.unreadMessages.getOrSet(conversation.id, { ids: [] })).ids
    const messages = props.client.listMessages({ conversationId: conversation.id })
    const newMessages = (await messages).messages
      .filter((message) => newMessageIds.includes(message.userId) && message.type === 'text')
      .map((message) => message.payload.text)

    await _updateTitleAndSummary({ client: props.client }, newMessages)
    await props.states.conversation.unreadMessages.set(conversation.id, { ids: [] })
  }
})

const _newMessage = async (props: {
  conversation: {
    id: bp.MessageHandlerProps['conversation']['id']
    tags: bp.MessageHandlerProps['conversation']['tags']
  }
  states: bp.MessageHandlerProps['states']
  user: bp.MessageHandlerProps['user']
  client: bp.MessageHandlerProps['client']
  logger: bp.MessageHandlerProps['logger']
}) => {
  const message_count = props.conversation.tags.message_count ? parseInt(props.conversation.tags.message_count) + 1 : 1
  props.logger.info(`message count tag: ${message_count}`)

  const participantsState = await props.states.conversation.participants.getOrSet(props.conversation.id, {
    ids: ['test'],
  })

  let updatedParticipants = participantsState.ids
  const senderId = props.user.id

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
  console.log('updated tags in conversation: ' + JSON.stringify(tags))
}

const _updateTitleAndSummary = async (_props: { client: bp.MessageHandlerProps['client'] }, messages: string[]) => {
  for (const message of messages) {
    console.log(`updated the title and summary of message ${message}`)
  }
}

export default plugin

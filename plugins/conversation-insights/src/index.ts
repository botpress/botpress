import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

const stubTags = {
  cost: '345',
  topics: 'rats',
  title: "I'm not crazy",
  summary: 'The user wants to explain to me that he is not crazy, but rats make him crazy. He seems crazy.',
}

plugin.on.message('*', async (props) => {
  await _newMessage(props)

  await props.client.createMessage({
    conversationId: props.conversation.id,
    payload: { text: 'string' },
    type: 'text',
    tags: {},
    userId: props.ctx.botId,
  })

  const unreads = await props.states.conversation.unreadMessages.getOrSet(props.conversation.id, { ids: [] })
  unreads.ids = unreads.ids ? unreads.ids : []
  props.states.conversation.unreadMessages.set(props.conversation.id, { ids: [...unreads.ids, props.message.id] })
})

// plugin.on.afterOutgoingMessage('*', async (props) => {

// })

const _newMessage = async (props: {
  conversation: bp.MessageHandlerProps['conversation']
  states: bp.MessageHandlerProps['states']
  user: bp.MessageHandlerProps['user']
  client: bp.MessageHandlerProps['client']
}) => {
  const message_count_tag = props.conversation.tags.message_count
  let message_count = 1
  if (message_count_tag) message_count += parseInt(message_count_tag)

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

const _updateTitleAndSummary = async (props: { client: bp.MessageHandlerProps['client'] }, messages: string[]) => {
  for (const message of messages) {
    console.log(`updated the title and summary of message ${message}`)
  }
}

export default plugin

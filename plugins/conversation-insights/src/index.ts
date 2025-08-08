import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.afterIncomingMessage('*', async (props) => {
  const conversationTags = await props.client
    .getConversation({ id: props.data.conversationId })
    .then(({ conversation }) => conversation.tags)

  await _onNewMessage(
    {
      ...props,
      conversation: { id: props.data.conversationId, tags: { ...conversationTags } },
      userId: props.data.userId,
    },
    true
  )

  return {}
})

plugin.on.afterOutgoingMessage('*', async (props) => {
  const conversation = await props.client.getConversation({ id: props.data.message.conversationId })
  await _onNewMessage({ ...props, conversation: conversation.conversation, userId: props.data.message.userId }, false)

  return {}
})

plugin.on.event('updateTitleAndSummary', async (props) => {
  const conversations = await props.client.listConversations({
    tags: { isDirty: 'true' },
  })

  for (const conversation of conversations.conversations) {
    const messages = await props.client.listMessages({ conversationId: conversation.id })
    const newMessages = messages.messages.map((message) => message.payload.text)

    await _updateTitleAndSummary({ client: props.client, conversationId: conversation.id }, newMessages)
  }
})

const _onNewMessage = async (
  props: {
    conversation: {
      id: bp.MessageHandlerProps['conversation']['id']
      tags: bp.MessageHandlerProps['conversation']['tags']
    }
    states: bp.MessageHandlerProps['states']
    userId: bp.MessageHandlerProps['user']['id']
    client: bp.MessageHandlerProps['client']
    logger: bp.MessageHandlerProps['logger']
  },
  isDirty: boolean
) => {
  const message_count = props.conversation.tags.message_count ? parseInt(props.conversation.tags.message_count) + 1 : 1

  const participant_count = await props.client
    .listParticipants({ id: props.conversation.id })
    .then(({ participants }) => participants.length)

  const tags = {
    message_count: message_count.toString(),
    participant_count: participant_count.toString(),
    isDirty: isDirty ? 'true' : 'false',
  }

  await props.client.updateConversation({
    id: props.conversation.id,
    tags,
  })
}

const _updateTitleAndSummary = async (
  props: { client: bp.MessageHandlerProps['client']; conversationId: string },
  _messages: string[]
) => {
  //TODO
  await props.client.updateConversation({
    id: props.conversationId,
    tags: {
      title: 'The conversation title!',
      summary: 'This is normally where the conversation summary would be.',
      isDirty: 'false',
    },
  })
}

export default plugin

import definition from '../plugin.definition'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.afterIncomingMessage('*', async (props) => {
  const conversationTags = await props.client.getConversation({ id: props.data.conversationId })

  // removing tags from plugins
  const allTagKeys = Object.keys(definition.conversation?.tags ?? {})
  const tags = allTagKeys.reduce(
    (acc, key) => {
      if (conversationTags.conversation.tags[key]) acc[key] = conversationTags.conversation.tags[key]
      return acc
    },
    {} as Record<string, string>
  )

  await _newMessage({
    ...props,
    conversation: { id: props.data.conversationId, tags: { ...tags, isDirty: 'true' } },
    userId: props.data.userId,
  })

  return { data: props.data }
})

plugin.on.afterOutgoingMessage('*', async (props) => {
  const conversation = await props.client.getConversation({ id: props.data.message.conversationId })
  await _newMessage({ ...props, conversation: conversation.conversation, userId: props.data.message.userId })

  return { data: { message: props.data.message } }
})

plugin.on.event('updateTitleAndSummary', async (props) => {
  const conversations = await props.client.listConversations({
    tags: { isDirty: 'true' },
  })

  for (const conversation of conversations.conversations) {
    const messages = props.client.listMessages({ conversationId: conversation.id })
    const newMessages = (await messages).messages.map((message) => message.payload.text)

    await _updateTitleAndSummary({ client: props.client, conversationId: conversation.id }, newMessages)
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

  const participant_count = (await props.client.listParticipants({ id: props.conversation.id })).participants.length

  const tags = {
    ...props.conversation.tags,
    message_count: message_count.toString(),
    participant_count: participant_count.toString(),
  }

  props.client.updateConversation({
    id: props.conversation.id,
    tags,
  })
}

const _updateTitleAndSummary = async (
  props: { client: bp.MessageHandlerProps['client']; conversationId: string },
  _messages: string[]
) => {
  //TODO: use a workflow that calls the cognitive service
  props.client.updateConversation({
    id: props.conversationId,
    tags: {
      title: 'The conversation title!',
      summary: 'This is normally where the conversation summary would be.',
      isDirty: 'false',
    },
  })
}

export default plugin

import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.message('*', async (props) => {
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

  const stubTags = {
    cost: '3189578',
    topics: 'rats',
    title: "I'm not crazy",
    summary: 'The user wants to explain to me that he is not crazy, but rats make him crazy. He seems crazy.',
  }

  await props.client.updateConversation({
    id: props.conversation.id,
    tags: { message_count: message_count.toString(), participant_count, ...stubTags },
  })

  console.log({ message_count, participant_count })

  await props.client.createMessage({
    conversationId: props.conversation.id,
    payload: { text: 'hiii' },
    type: 'text',
    tags: {},
    userId: props.ctx.botId,
  })
})

export default plugin

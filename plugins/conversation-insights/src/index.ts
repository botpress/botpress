import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.message('*', async (props) => {
  const message_count_tag = props.conversation.tags.message_count
  let message_count = 1
  if (message_count_tag) message_count += parseInt(message_count_tag)

  const participantsState = await props.client.getOrSetState({
    id: props.conversation.id,
    name: 'participants',
    type: 'conversation',
    payload: { ids: [] },
  })

  let updatedParticipants = participantsState.state.payload.ids
  const senderId = props.user.id

  if (!updatedParticipants.includes(senderId)) {
    updatedParticipants = [...updatedParticipants, senderId]
    await props.client.setState({
      id: props.conversation.id,
      name: 'participants',
      type: 'conversation',
      payload: { ids: updatedParticipants },
    })
  }

  props.client.updateConversation({
    id: props.conversation.id,
    tags: { message_count: message_count.toString(), participant_count: updatedParticipants.length.toString() },
  })
})

export default plugin

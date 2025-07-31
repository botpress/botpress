import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.message('*', async (props) => {
  const message_count_tag = props.conversation.tags.message_count
  let message_count = 0
  if (message_count_tag) message_count = parseInt(message_count_tag)

  const participantsState = props.client.getState({
    id: props.conversation.id,
    name: 'participants',
    type: 'conversation',
  })

  const participants = (await participantsState).state.payload
  const senderId = props.user.id

  let updatedParticipants = participants
  if (!participants.includes(senderId)) {
    updatedParticipants = [...participants, senderId]
    //
    await props.client.setState({
      id: props.conversation.id,
      name: 'participants',
      type: 'conversation',
      payload: updatedParticipants,
    })
  }

  const participant_count = updatedParticipants.length

  props.client.updateConversation({
    id: props.conversation.id,
    tags: { message_count: (message_count + 1).toString(), participant_count },
  })
})

export default plugin

import * as types from './types'

type OnNewMessageProps = types.CommonProps & {
  conversation: types.ActionableConversation
}
export const onNewMessage = async (props: OnNewMessageProps) => {
  const message_count = props.conversation.tags.message_count ? parseInt(props.conversation.tags.message_count) + 1 : 1

  const participant_count = await props.conversation
    .listParticipants()
    .takeAll()
    .then((participants) => participants.length)

  await props.conversation.update({
    tags: {
      message_count: message_count.toString(),
      participant_count: participant_count.toString(),
      isDirty: props.configuration.aiEnabled ? 'true' : 'false',
    },
  })
  return
}

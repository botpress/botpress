import * as types from './types'
import * as bp from '.botpress'

type OnNewMessageProps = types.CommonProps & {
  conversation: bp.ClientOutputs['getConversation']['conversation']
}
export const onNewMessage = async (props: OnNewMessageProps) => {
  const message_count = props.conversation.tags.message_count ? parseInt(props.conversation.tags.message_count) + 1 : 1

  const participant_count = await props.client
    .listParticipants({ id: props.conversation.id })
    .then(({ participants }) => participants.length)

  const tags = {
    message_count: message_count.toString(),
    participant_count: participant_count.toString(),
    isDirty: 'true',
  }

  await props.client.updateConversation({
    id: props.conversation.id,
    tags,
  })
  return
}

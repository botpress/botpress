import * as consts from '../consts'
import * as bp from '.botpress'

export const handleMessage: bp.HookHandlers['before_incoming_message']['*'] = async (props) => {
  if (!_isGroupChatMessage(props)) {
    return consts.LET_BOT_HANDLE_EVENT
  }

  props.logger.with(props.data).debug('Redirecting group chat message to a thread', props.data.id)

  // Ask the backing integration to create a reply thread for the original message:
  await props.actions['threaded-responses'].createReplyThread({
    parentMessage: props.data,
    parentConversation: props.conversation,
    messageAuthor: props.user,
  })

  // Prevent the bot from replying to the original message in the group chat:
  return consts.STOP_EVENT_HANDLING
}

const _isGroupChatMessage = (props: bp.HookHandlerProps['before_incoming_message']) =>
  props.conversation.channel === props.interfaces['threaded-responses'].channels.groupChat.name &&
  props.conversation.integration === props.interfaces['threaded-responses'].name

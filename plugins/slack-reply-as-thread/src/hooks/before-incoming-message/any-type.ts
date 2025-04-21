import * as consts from '../consts'
import * as bp from '.botpress'

export const handleMessage: bp.HookHandlers['before_incoming_message']['*'] = async (props) => {
  if (!props.configuration.enableThreading) {
    props.logger.with(props.data).debug('Threading disabled, skipping')
    return consts.LET_BOT_HANDLE_EVENT
  }

  const { conversation: parentConversation } = await props.client.getConversation({ id: props.data.conversationId })

  if (parentConversation.channel !== 'channel') {
    return consts.LET_BOT_HANDLE_EVENT
  }

  props.logger.with(props.data).debug('Redirecting channel message to a reply thread', props.data.id)

  // Ask the backing integration to create a reply thread for the original message:
  await props.actions.slack.forwardToReplyThread({
    parentMessage: { ...props.data, tags: _expandTags(props.data.tags) },
  })

  // Prevent the bot from replying to the original message in the channel:
  return consts.STOP_EVENT_HANDLING
}

const _expandTags = (tags: Record<string, string>) =>
  Object.fromEntries(
    new Map(
      Object.entries(tags).flatMap(([tagName, value]) =>
        tagName.includes(':')
          ? [
              [tagName, value],
              [tagName.split(':')[1], value],
            ]
          : [[tagName, value]]
      )
    )
  )

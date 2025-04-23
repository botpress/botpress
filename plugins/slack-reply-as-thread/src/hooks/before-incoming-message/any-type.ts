import { getMessageRouting } from '../../message-routing-algorithm'
import * as consts from '../consts'
import * as bp from '.botpress'

const IS_BROWSER: boolean =
  // @ts-expect-error
  typeof window !== 'undefined' && typeof window.document !== 'undefined'

export const handleMessage: bp.HookHandlers['before_incoming_message']['*'] = async (props) => {
  if (IS_BROWSER) {
    props.logger.warn(
      'The Slack Reply as Thread plugin is not supported in the studio. Ignoring message routing logic.'
    )
    return consts.LET_BOT_HANDLE_EVENT
  }

  const { conversation: parentConversation } = await props.client.getConversation({ id: props.data.conversationId })

  if (parentConversation.integration !== 'slack') {
    props.logger.debug('Ignoring message routing logic for non-Slack conversations')
    return consts.LET_BOT_HANDLE_EVENT
  }

  const { shouldForkToReplyThread, shouldPreventBotFromReplying } = getMessageRouting({
    configuration: props.configuration,
    message: { ...props.data, tags: _expandTags(props.data.tags) },
    conversation: { ...parentConversation, tags: _expandTags(parentConversation.tags) },
  })

  if (shouldForkToReplyThread) {
    props.logger.with(props.data).debug('Redirecting channel message to a reply thread', props.data.id)

    // Ask the backing integration to create a reply thread for the original message:
    await props.actions.slack.forwardToReplyThread({
      parentMessage: { ...props.data, tags: _expandTags(props.data.tags) },
    })
  }

  return shouldPreventBotFromReplying ? consts.STOP_EVENT_HANDLING : consts.LET_BOT_HANDLE_EVENT
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

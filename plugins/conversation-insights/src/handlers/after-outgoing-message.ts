import { isBrowser } from 'browser-or-node'
import * as onNewMessageHandler from '../onNewMessageHandler'
import * as bp from '.botpress'

export const handleAfterOutgoingMessage: bp.HookHandlers['after_outgoing_message']['*'] = async (props) => {
  if (isBrowser) {
    return
  }
  const conversation = await props.conversations['*']['*'].getById({ id: props.data.message.conversationId })
  await onNewMessageHandler.onNewMessage({ ...props, conversation })
  return undefined
}

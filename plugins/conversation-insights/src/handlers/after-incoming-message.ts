import * as onNewMessageHandler from '../onNewMessageHandler'
import * as bp from '.botpress'

const HOUR_MILLISECONDS = 60 * 60 * 1000

export const handleAfterIncomingMessage: bp.HookHandlers['after_incoming_message']['*'] = async (props) => {
  const conversation = await props.conversations['*']['*'].getById({ id: props.data.conversationId })
  await onNewMessageHandler.onNewMessage({ ...props, conversation })

  if (props.configuration.aiEnabled) {
    const events = await props.events.updateAiInsight.list({ status: 'scheduled' }).take(1)
    if (events.length === 0) {
      const dateTime = new Date(Date.now() + HOUR_MILLISECONDS).toISOString()
      await props.events.updateAiInsight.schedule({}, { dateTime })
    }
  }

  return undefined
}

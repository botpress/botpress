import * as onNewMessageHandler from '../onNewMessageHandler'
import * as bp from '.botpress'

const HOUR_MILLISECONDS = 60 * 60 * 1000

export const handleAfterIncomingMessage: bp.HookHandlers['after_incoming_message']['*'] = async (props) => {
  const { conversations, configuration, events, data } = props
  const conversation = await conversations['*']['*'].getById({ id: data.conversationId })
  await onNewMessageHandler.onNewMessage({ ...props, conversation })

  if (configuration.aiEnabled) {
    const updateAiEvents = await events.updateAiInsight.list({ status: 'scheduled' }).take(1)
    if (updateAiEvents.length === 0) {
      const interval = configuration.aiGenerationInterval
        ? configuration.aiGenerationInterval * 60 * 1000
        : HOUR_MILLISECONDS
      const dateTime = new Date(Date.now() + interval).toISOString()
      await events.updateAiInsight.schedule({}, { dateTime })
    }
  }

  return undefined
}

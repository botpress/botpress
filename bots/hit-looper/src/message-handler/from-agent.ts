import { respond } from '../api-utils'
import { getOrCreateFlow, setFlow } from '../flow-state'
import { MessageHandler } from '../types'

export const agentMessageHandler: MessageHandler = async ({ client, conversation: downstream, message, ctx }) => {
  const flow = await getOrCreateFlow({ client, conversationId: downstream.id }, { hitlEnabled: true })
  if (!flow.hitlEnabled) {
    await respond(
      { client, conversationId: downstream.id, ctx },
      'Hitl is not enabled so nobody is reading your messages'
    )
    return
  }

  const upstream = downstream.tags['upstream']
  if (!upstream) {
    throw new Error('Downstream conversation was not binded to upstream conversation')
  }

  if (message.payload.text.trim() === '/stop_hitl') {
    await setFlow({ client, conversationId: downstream.id }, { hitlEnabled: false })
    await setFlow({ client, conversationId: upstream }, { hitlEnabled: false })

    const disabledMsg = 'Hitl has been disabled'
    await respond({ client, conversationId: downstream.id, ctx }, disabledMsg)
    await respond({ client, conversationId: upstream, ctx }, disabledMsg)
    return
  }
  await respond({ client, conversationId: upstream, ctx }, message.payload.text)
}

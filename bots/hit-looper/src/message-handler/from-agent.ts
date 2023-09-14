import { mkRespond } from '../api-utils'
import { getOrCreateFlow, setFlow } from '../flow-state'
import { MessageHandler } from '../types'

export const agentMessageHandler: MessageHandler = async (props) => {
  const { client, conversation: downstream, message } = props
  const respond = mkRespond(props)

  const flow = await getOrCreateFlow({ client, conversationId: downstream.id }, { hitlEnabled: true })
  if (!flow.hitlEnabled) {
    await respond({ conversationId: downstream.id, text: 'Hitl is not enabled so nobody is reading your messages' })
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
    await respond({ conversationId: downstream.id, text: disabledMsg })
    await respond({ conversationId: upstream, text: disabledMsg })
    return
  }
  await respond({ conversationId: upstream, text: message.payload.text })
}

import { mkRespond } from '../api-utils'
import { getOrCreateFlow, setFlow } from '../flow-state'
import { MessageHandler } from '../types'

export const agentMessageHandler: MessageHandler = async (props) => {
  if (props.message.type !== 'text') {
    return
  }

  const { client, conversation: downstreamConversation, message } = props
  const respond = mkRespond(props)

  const flow = await getOrCreateFlow({ client, conversationId: downstreamConversation.id }, { hitlEnabled: true })
  if (!flow.hitlEnabled) {
    await respond({
      conversationId: downstreamConversation.id,
      text: 'Hitl is not enabled so nobody is reading your messages',
    })
    return
  }

  const upstreamConversationId = downstreamConversation.tags['upstream']
  if (!upstreamConversationId) {
    throw new Error('Downstream conversation was not binded to upstream conversation')
  }

  if (message.payload.text.trim() === '/stop_hitl') {
    await setFlow({ client, conversationId: downstreamConversation.id }, { hitlEnabled: false })
    await setFlow({ client, conversationId: upstreamConversationId }, { hitlEnabled: false })

    const disabledMsg = 'Hitl has been disabled'
    await respond({ conversationId: downstreamConversation.id, text: disabledMsg })
    await respond({ conversationId: upstreamConversationId, text: disabledMsg })
    return
  }
  await respond({ conversationId: upstreamConversationId, text: message.payload.text })
}

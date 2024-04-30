import { mkRespond } from 'src/api-utils'
import { getOrCreateFlow, setFlow } from '../flow-state'
import { MessageHandler } from '../types'

export const patientMessageHandler: MessageHandler = async (props) => {
  const respond = mkRespond(props)
  const { message, client, conversation: upstream } = props

  const upstreamFlow = await getOrCreateFlow({ client, conversationId: upstream.id }, { hitlEnabled: false })
  if (!upstreamFlow.hitlEnabled) {
    if (message.payload.text.trim() === '/start_hitl') {
      await respond({ conversationId: upstream.id, text: 'Connecting you to a human agent...' })

      try {
        const { output: session } = await client.callAction({
          type: 'sfliveagent:createConversationSession',
          input: {},
        })

        const {
          output: { conversationId: downstreamId },
        } = await client.callAction({
          type: 'sfliveagent:getConversationFromSession',
          input: {
            session,
          },
        })

        await client.updateConversation({
          id: downstreamId,
          tags: {
            upstream: upstream.id,
          },
        })

        await client.updateConversation({
          id: upstream.id,
          tags: {
            downstream: downstreamId,
          },
        })

        const {
          output: {},
        } = await client.callAction({
          type: 'sfliveagent:startChat',
          input: {
            session,
            userName: 'Anonymous User',
          },
        })

        await setFlow({ client, conversationId: upstream.id }, { hitlEnabled: true })
        await setFlow({ client, conversationId: downstreamId }, { hitlEnabled: true })
      } catch (e) {
        await respond({ conversationId: upstream.id, text: 'Failed to start session: ' + e.message })
      }
      return
    }

    await respond({
      conversationId: upstream.id,
      text: [
        'Hi, I am a bot.',
        'I cannot answer your questions.',
        'Type `/start_hitl` to talk to a human agent.',
        'Have fun :)',
      ].join('\n'),
    })
    return
  }

  const downstream = upstream.tags['downstream']
  if (!downstream) {
    throw new Error('Upstream conversation was not binded to downstream conversation')
  }

  await respond({ conversationId: downstream, text: message.payload.text })
}

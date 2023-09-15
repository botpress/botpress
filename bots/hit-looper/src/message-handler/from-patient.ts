import { mkRespond } from 'src/api-utils'
import { getOrCreateFlow, setFlow } from '../flow-state'
import { MessageHandler } from '../types'

export const patientMessageHandler: MessageHandler = async (props) => {
  const respond = mkRespond(props)
  const { message, client, conversation: upstream } = props

  const upstreamFlow = await getOrCreateFlow({ client, conversationId: upstream.id }, { hitlEnabled: false })
  if (!upstreamFlow.hitlEnabled) {
    if (message.payload.text.trim() === '/start_hitl') {
      const {
        output: { ticket },
      } = await client.callAction({
        type: 'zendesk:createTicket',
        // TODO: get these from the user or the upstream integration
        input: {
          requesterEmail: 'john.doe@foobar.com',
          requesterName: 'John Doe',
          subject: `Hitl request ${Date.now()}`,
          comment: 'I need help.',
        },
      })

      const {
        output: { conversationId: downstreamId },
      } = await client.callAction({
        type: 'zendesk:getTicketConversation',
        input: {
          ticketId: `${ticket.id}`,
        },
      })

      await client.callAction({
        type: 'zendesk:setConversationRequester',
        input: {
          conversationId: downstreamId,
          requesterId: `${ticket.requesterId}`,
        },
      })

      await client.updateConversation({
        id: upstream.id,
        tags: {
          downstream: downstreamId,
        },
      })

      await client.updateConversation({
        id: downstreamId,
        tags: {
          upstream: upstream.id,
        },
      })

      await setFlow({ client, conversationId: upstream.id }, { hitlEnabled: true })
      await setFlow({ client, conversationId: downstreamId }, { hitlEnabled: true })
      await respond({ conversationId: upstream.id, text: 'Transfering you to a human agent...' })
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

import { respond } from '../api-utils'
import { getOrCreateFlow, setFlow } from '../flow-state'
import { MessageHandler } from '../types'

export const patientMessageHandler: MessageHandler = async ({ message, client, ctx, conversation: upstream }) => {
  const upstreamFlow = await getOrCreateFlow({ client, conversationId: upstream.id }, { hitlEnabled: false })
  if (!upstreamFlow.hitlEnabled) {
    if (message.payload.text.trim() === '/start_hitl') {
      const {
        output: { ticket },
      } = await client.callAction({
        type: 'zendesk:createTicket',
        // TODO: get these from the user or the upstream integration
        input: {
          requesterEmail: 'john.doe@botpress.com',
          requesterName: 'John Doe',
          subject: 'Hitl request',
          comment: 'I need help.',
        },
      })

      const {
        output: { conversationId: downstreamId },
      } = await client.callAction({
        type: 'zendesk:startTicketConversation',
        input: {
          ticketId: `${ticket.id}`,
        },
      })

      await client.updateConversation({
        id: upstream.id,
        participantIds: [], // TODO: rm that when updating the api
        tags: {
          downstream: downstreamId,
        },
      })

      await client.updateConversation({
        id: downstreamId,
        participantIds: [], // TODO: rm that when updating the api
        tags: {
          upstream: upstream.id,
        },
      })

      await setFlow({ client, conversationId: upstream.id }, { hitlEnabled: true })
      await setFlow({ client, conversationId: downstreamId }, { hitlEnabled: true })
      await respond({ client, conversationId: upstream.id, ctx }, 'Transfering you to a human agent...')
      return
    }

    await respond(
      { client, conversationId: upstream.id, ctx },
      [
        'Hi, I am a bot.',
        'I cannot answer your questions.',
        'Type `/start_hitl` to talk to a human agent.',
        'Have fun :)',
      ].join('\n')
    )
    return
  }

  const downstream = upstream.tags['downstream']
  if (!downstream) {
    throw new Error('Upwnstream conversation was not binded to downstream conversation')
  }

  await respond({ client, conversationId: downstream, ctx }, message.payload.text)
}

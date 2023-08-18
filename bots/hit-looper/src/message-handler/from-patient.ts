import { getOrCreateFlow, setFlow } from 'src/flow-state'
import { respond } from '../api-utils'
import { MessageHandler } from '../types'

export const patientMessageHandler: MessageHandler = async ({ message, client, ctx, conversation: upstream }) => {
  const upstreamFlow = await getOrCreateFlow({ client, conversationId: upstream.id }, { hitlEnabled: false })
  if (!upstreamFlow.hitlEnabled) {
    if (message.payload.text === '/start_hitl') {
      const { output } = await client.callAction({
        type: 'zendesk:createTicket',
        input: {
          __conversationId: upstream.id, // TODO: remove that, this is not needed
          requesterEmail: 'john.doe@botpress.com',
          requesterName: 'John Doe',
          subject: 'Hitl request',
          comment: "I'm a patient and I need help.",
        },
      })

      const downstreamId = output.conversationId

      await client.updateConversation({
        id: upstream.id,
        participantIds: [], // not used by the backend (this is a bug)
        tags: {
          downstream: downstreamId,
        },
      })

      await client.updateConversation({
        id: downstreamId,
        participantIds: [], // not used by the backend (this is a bug)
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
        'GLHF',
      ].join('\n')
    )
    return
  }

  if (!upstream.tags['downstream']) {
    throw new Error('Upwnstream conversation was not binded to downstream conversation')
  }
  await respond({ client, conversationId: upstream.tags['downstream'], ctx }, message.payload.text)
}

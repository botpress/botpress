import type { TriggerPayload } from 'src/triggers'
import * as bp from '.botpress'

export const executeTicketSolved = async ({
  zendeskTrigger,
  client,
}: {
  zendeskTrigger: TriggerPayload
  client: bp.Client
}) => {
  const { ticketId } = zendeskTrigger

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: ticketId,
    },
  })

  await client.createEvent({
    type: 'hitlStopped',
    payload: {
      conversationId: conversation.id,
    },
  })
}

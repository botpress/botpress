import type { TriggerPayload } from 'src/triggers'
import * as bp from '.botpress'

export const executeTicketAssigned = async ({
  zendeskTrigger,
  client,
}: {
  zendeskTrigger: TriggerPayload
  client: bp.Client
}) => {
  const { ticketId, agent } = zendeskTrigger

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: ticketId,
    },
  })

  const { user } = await client.getOrCreateUser({
    name: agent.name,
    tags: {
      email: agent.email,
    },
  })

  await client.createEvent({
    type: 'hitlAssigned',
    payload: {
      conversationId: conversation.id,
      userId: user.id,
    },
  })
}

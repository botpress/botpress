import { normalizeTicket } from './normalizeTicket'
import * as bp from '.botpress'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeTicketUpdated = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body } = props

  const ticket = normalizeTicket(body['ticket'] as Record<string, unknown>)

  const { user } = await client.getOrCreateUser({
    tags: { freshdeskRequesterId: String(ticket['requester_id'] ?? 'unknown') },
  })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'ticket',
    tags: { freshdeskTicketId: String(ticket['id']) },
  })

  await client.createEvent({
    type: 'ticketUpdated',
    payload: {
      ticket: ticket as bp.events.ticketUpdated.TicketUpdated['ticket'],
    },
    conversationId: conversation.id,
    userId: user.id,
  })
}

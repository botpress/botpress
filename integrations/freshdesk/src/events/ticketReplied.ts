import * as bp from '.botpress'
import { normalizeTicket } from './normalizeTicket'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeticketReplied = async (props: HandlerProps & { body: Record<string, unknown> }) => {
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
    type: 'ticketReplied',
    payload: {
      ticket: ticket as bp.events.ticketReplied.TicketReplied['ticket'],
      reply: body['reply'] as bp.events.ticketReplied.TicketReplied['reply'],
    },
    conversationId: conversation.id,
    userId: user.id,
  })
}

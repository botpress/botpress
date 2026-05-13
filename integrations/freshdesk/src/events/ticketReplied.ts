import { normalizeTicket } from './normalizeTicket'
import * as bp from '.botpress'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeTicketReplied = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body, logger } = props
  const log = logger.forBot()

  if (!body['reply']) {
    log.warn('ticketReplied webhook missing reply field, ignoring')
    return
  }

  const rawTicket = body['ticket']
  if (!rawTicket || typeof rawTicket !== 'object') {
    log.warn('ticketReplied webhook missing ticket field, ignoring')
    return
  }
  const ticket = normalizeTicket(rawTicket as Record<string, unknown>)

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

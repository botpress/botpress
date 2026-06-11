import { mapTicket } from './mappers'
import { ticketCreatedBodySchema } from './schemas'
import * as bp from '.botpress'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeTicketCreated = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body, logger } = props
  const log = logger.forBot()

  const parsed = ticketCreatedBodySchema.safeParse(body)
  if (!parsed.success) {
    log.warn(`ticketCreated webhook has invalid payload: ${parsed.error.message}`)
    return
  }
  const { ticket } = parsed.data

  if (!ticket.requester_id) {
    log.warn('ticketCreated webhook has no requester_id, skipping event')
    return
  }

  const { user } = await client.getOrCreateUser({
    tags: { freshdeskRequesterId: String(ticket.requester_id) },
  })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'ticket',
    tags: { freshdeskTicketId: String(ticket.id) },
  })

  await client.createEvent({
    type: 'ticketCreated',
    payload: { ticket: mapTicket(ticket) },
    userId: user.id,
    conversationId: conversation.id,
  })
}

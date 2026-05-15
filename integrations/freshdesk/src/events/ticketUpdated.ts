import { mapTicket } from './mappers'
import { ticketUpdatedBodySchema } from './schemas'
import * as bp from '.botpress'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeTicketUpdated = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body, logger } = props
  const log = logger.forBot()

  const parsed = ticketUpdatedBodySchema.safeParse(body)
  if (!parsed.success) {
    log.warn(`ticketUpdated webhook has invalid payload: ${parsed.error.message}`)
    return
  }
  const { ticket } = parsed.data

  if (!ticket.requester_id) {
    log.warn('ticketUpdated webhook has no requester_id, skipping event')
    return
  }

  const { user } = await client.getOrCreateUser({
    tags: { freshdeskRequesterId: String(ticket.requester_id) },
  })

  // TODO(HITL): get or create a conversation on the ticket channel and pass conversationId to createEvent
  await client.createEvent({
    type: 'ticketUpdated',
    payload: { ticket: mapTicket(ticket) },
    userId: user.id,
  })
}

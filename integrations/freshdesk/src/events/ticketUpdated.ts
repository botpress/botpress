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

  const { conversation } = await client.getOrCreateConversation({
    channel: 'ticket',
    tags: { freshdeskTicketId: String(ticket.id) },
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

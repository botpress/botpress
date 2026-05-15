import { mapTicket, mapReply } from './mappers'
import { ticketRepliedBodySchema } from './schemas'
import * as bp from '.botpress'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeTicketReplied = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body, logger } = props
  const log = logger.forBot()

  const parsed = ticketRepliedBodySchema.safeParse(body)
  if (!parsed.success) {
    log.warn(`ticketReplied webhook has invalid payload: ${parsed.error.message}`)
    return
  }
  const { ticket, reply } = parsed.data

  if (!ticket.requester_id) {
    log.warn('ticketReplied webhook has no requester_id, skipping event')
    return
  }

  const { user } = await client.getOrCreateUser({
    tags: { freshdeskRequesterId: String(ticket.requester_id) },
  })

  // TODO(HITL): get or create a conversation on the ticket channel and pass conversationId to createEvent
  await client.createEvent({
    type: 'ticketReplied',
    payload: { ticket: mapTicket(ticket), reply: mapReply(reply) },
    userId: user.id,
  })
}

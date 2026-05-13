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

  const { user } = await client.getOrCreateUser({
    tags: { freshdeskRequesterId: String(ticket.requester_id ?? 'unknown') },
  })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'ticket',
    tags: { freshdeskTicketId: String(ticket.id) },
  })

  await client.createEvent({
    type: 'ticketReplied',
    payload: {
      ticket: ticket as bp.events.ticketReplied.TicketReplied['ticket'],
      reply: reply as bp.events.ticketReplied.TicketReplied['reply'],
    },
    conversationId: conversation.id,
    userId: user.id,
  })
}

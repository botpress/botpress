import * as bp from '.botpress'
import { normalizeTicket } from './normalizeTicket'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeTicketCreated = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body } = props

  await client.createEvent({
    type: 'ticketCreated',
    payload: {
      ticket: normalizeTicket(body['ticket'] as Record<string, unknown>) as bp.events.ticketCreated.TicketCreated['ticket'],
    },
  })
}

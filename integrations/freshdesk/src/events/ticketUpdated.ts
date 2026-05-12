import * as bp from '.botpress'
import { normalizeTicket } from './normalizeTicket'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeTicketUpdated = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body } = props

  await client.createEvent({
    type: 'ticketUpdated',
    payload: {
      ticket: normalizeTicket(body['ticket'] as Record<string, unknown>) as bp.events.ticketUpdated.TicketUpdated['ticket'],
    },
  })
}

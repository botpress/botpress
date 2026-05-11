import * as bp from '.botpress'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeTicketUpdated = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body } = props

  await client.createEvent({
    type: 'ticketUpdated',
    payload: {
      ticket: body['ticket'] as bp.events.ticketUpdated.TicketUpdated['ticket'],
    },
  })
}

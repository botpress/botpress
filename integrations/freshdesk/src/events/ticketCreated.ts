import * as bp from '.botpress'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeTicketCreated = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body } = props

  await client.createEvent({
    type: 'ticketCreated',
    payload: {
      ticket: body['ticket'] as bp.events.ticketCreated.TicketCreated['ticket'],
    },
  })
}

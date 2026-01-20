import { transformTicket } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const closeTicket: bp.IntegrationProps['actions']['closeTicket'] = async (props) => {
  const { client: bpClient, ctx, input, logger } = props
  const zendeskClient = await getZendeskClient(bpClient, ctx, logger)
  const originalTicket = await zendeskClient.getTicket(input.ticketId)

  const { ticket } = await zendeskClient.updateTicket(input.ticketId, {
    comment: {
      body: input.comment,
      author_id: originalTicket.requester_id,
    },
    status: 'closed',
  })

  return {
    ticket: transformTicket(ticket),
  }
}

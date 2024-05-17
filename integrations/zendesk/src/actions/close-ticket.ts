import { transformTicket } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const closeTicket: bp.IntegrationProps['actions']['closeTicket'] = async ({ ctx, input }) => {
  const originalTicket = await getZendeskClient(ctx.configuration).getTicket(input.ticketId)

  const ticket = await getZendeskClient(ctx.configuration).updateTicket(input.ticketId, {
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

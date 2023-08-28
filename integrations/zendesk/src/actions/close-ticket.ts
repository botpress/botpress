import { transformTicket } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import { IntegrationProps } from '.botpress'

export const closeTicket: IntegrationProps['actions']['closeTicket'] = async ({ ctx, input }) => {
  const originalTicket = await getZendeskClient(ctx.configuration).getTicket(input.ticketId)

  console.info(originalTicket)
  const ticket = await getZendeskClient(ctx.configuration).updateTicket(input.ticketId, {
    comment: input.comment,
    authorId: originalTicket.requester_id,
    status: 'closed',
  })

  console.log('update with', {
    comment: input.comment,
    authorId: originalTicket.requester_id,
    status: 'closed',
  })

  return {
    ticket: transformTicket(ticket),
  }
}

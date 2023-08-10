import { transformTicket } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import type { Implementation } from '../types'

export const closeTicket: Implementation['actions']['closeTicket'] = async ({ ctx, input }) => {
  const ticket = await getZendeskClient(ctx.configuration).updateTicket(input.ticketId, {
    comment: input.comment,
    status: 'closed',
  })

  return {
    ticket: transformTicket(ticket),
  }
}

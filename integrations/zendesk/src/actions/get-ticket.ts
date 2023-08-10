import { ticketSchema } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import type { Implementation } from '../types'

export const getTicket: Implementation['actions']['getTicket'] = async ({ ctx, input }) => {
  const ticket = await getZendeskClient(ctx.configuration).getTicket(input.ticketId)
  return { ticket: ticketSchema.parse(ticket) }
}

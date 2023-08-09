import { getZendeskClient } from '../client'
import type { Implementation } from '../misc/types'

export const getTicket: Implementation['actions']['getTicket'] = async ({ ctx, input }) => {
  return getZendeskClient(ctx.configuration).getTicket(input.ticketId)
}

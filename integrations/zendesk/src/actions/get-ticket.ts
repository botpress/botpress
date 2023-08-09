import { getZendeskClient } from '../client'
import type { Implementation } from '../misc/types'

export const getTicket: Implementation['actions']['getTicket'] = async ({ ctx, input }) => {
  const zendeskClient = getZendeskClient(ctx.configuration)
  const ticket = await zendeskClient.getTicket(input.ticketId)
  return {
    ticket,
  }
}

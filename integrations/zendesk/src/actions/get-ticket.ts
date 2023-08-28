import { transformTicket } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import { IntegrationProps } from '.botpress'

export const getTicket: IntegrationProps['actions']['getTicket'] = async ({ ctx, input }) => {
  const ticket = await getZendeskClient(ctx.configuration).getTicket(input.ticketId)
  return { ticket: transformTicket(ticket) }
}

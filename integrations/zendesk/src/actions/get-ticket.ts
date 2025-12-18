import { transformTicket } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const getTicket: bp.IntegrationProps['actions']['getTicket'] = async ({ client: bpClient, ctx, input }) => {
  const zendeskClient = await getZendeskClient(bpClient, ctx)
  const ticket = await zendeskClient.getTicket(input.ticketId)
  return { ticket: transformTicket(ticket) }
}

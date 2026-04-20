import { transformTicket } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const getTicket: bp.IntegrationProps['actions']['getTicket'] = async (props) => {
  const { client: bpClient, ctx, input, logger } = props
  const zendeskClient = await getZendeskClient(bpClient, ctx, logger)
  const ticket = await zendeskClient.getTicket(input.ticketId)
  return { ticket: transformTicket(ticket) }
}

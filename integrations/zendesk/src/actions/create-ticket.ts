import { transformTicket } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const createTicket: bp.IntegrationProps['actions']['createTicket'] = async (props) => {
  const { client: bpClient, ctx, input, logger } = props
  const zendeskClient = await getZendeskClient(bpClient, ctx, logger)
  const ticket = await zendeskClient.createTicket(input.subject, input.comment, {
    name: input.requesterName,
    email: input.requesterEmail,
  })

  return {
    ticket: transformTicket(ticket),
  }
}

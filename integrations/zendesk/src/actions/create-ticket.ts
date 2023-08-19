import { transformTicket } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import { IntegrationProps } from '.botpress'

export const createTicket: IntegrationProps['actions']['createTicket'] = async ({ ctx, input }) => {
  const zendeskClient = getZendeskClient(ctx.configuration)
  const ticket = await zendeskClient.createTicket(input.subject, input.comment, {
    name: input.requesterName,
    email: input.requesterEmail,
  })

  return {
    ticket: transformTicket(ticket),
  }
}

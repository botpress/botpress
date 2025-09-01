import { getAccessToken } from '../auth'
import { HubspotClient } from '../hubspot-api'
import * as bp from '.botpress'

export const createTicket: bp.IntegrationProps['actions']['createTicket'] = async ({ client, ctx, input }) => {
  const hsClient = new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })

  const newTicket = await hsClient.createTicket({
    subject: input.subject,
    category: input.category,
    source: input.source,
    description: input.description,
    additionalProperties: Object.fromEntries(input.additionalProperties.map(({ name, value }) => [name, value])),
    pipelineNameOrId: input.pipeline,
    pipelineStageNameOrId: input.pipelineStage,
    linearTicketUrl: input.linearTicketUrl,
    priority: input.priority,
    ticketOwnerEmailOrId: input.ticketOwner,
    requesterEmailOrId: input.requester,
    companyIdOrNameOrDomain: input.company,
  })

  return {
    ticketId: newTicket.ticketId,
  }
}

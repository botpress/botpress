import { getAuthenticatedHubspotClient, propertiesEntriesToRecord } from 'src/utils'
import * as bp from '.botpress'

export const createTicket: bp.IntegrationProps['actions']['createTicket'] = async ({ client, ctx, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx })

  const newTicket = await hsClient.createTicket({
    subject: input.subject,
    category: input.category,
    source: input.source,
    description: input.description,
    additionalProperties: propertiesEntriesToRecord(input.properties ?? []),
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

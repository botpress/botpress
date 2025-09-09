import { z } from '@botpress/sdk'
import { ticketSchema } from '../../definitions/actions/ticket'
import { getAuthenticatedHubspotClient, propertiesEntriesToRecord } from '../utils'
import * as bp from '.botpress'

type HubspotClient = Awaited<ReturnType<typeof getAuthenticatedHubspotClient>>
type HsTicket = Awaited<ReturnType<HubspotClient['createTicket']>>
type BpTicket = z.infer<typeof ticketSchema>

const _mapHsTicketToBpTicket = (hsTicket: HsTicket): BpTicket => ({
  id: hsTicket.id,
  subject: hsTicket.properties.subject ?? '',
  category: hsTicket.properties.hs_ticket_category ?? '',
  description: hsTicket.properties.content ?? '',
  priority: hsTicket.properties.hs_ticket_priority ?? '',
  source: hsTicket.properties.source_type ?? '',
  properties: hsTicket.properties,
})

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
    priority: input.priority,
    ticketOwnerEmailOrId: input.ticketOwner,
    requesterEmailOrId: input.requester,
    companyIdOrNameOrDomain: input.company,
  })

  return {
    ticket: _mapHsTicketToBpTicket(newTicket),
  }
}

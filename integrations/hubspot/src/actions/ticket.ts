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

const _getTicketPropertyKeys = async (hsClient: HubspotClient) => {
  const properties = await hsClient.getAllObjectProperties('tickets')
  return properties.results.map((property) => property.name)
}

export const searchTicket: bp.IntegrationProps['actions']['searchTicket'] = async ({ client, ctx, input, logger }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx, logger })
  const propertyKeys = input.properties?.length ? input.properties : await _getTicketPropertyKeys(hsClient)

  const ticket = await hsClient.searchTicket({
    subject: input.subject,
    category: input.category,
    priority: input.priority,
    propertiesToReturn: propertyKeys,
  })

  return {
    ticket: ticket ? _mapHsTicketToBpTicket(ticket) : undefined,
  }
}

export const createTicket: bp.IntegrationProps['actions']['createTicket'] = async ({ client, ctx, input, logger }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx, logger })

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

export const getTicket: bp.IntegrationProps['actions']['getTicket'] = async ({ client, ctx, input, logger }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx, logger })
  const propertyKeys = await _getTicketPropertyKeys(hsClient)

  const ticket = await hsClient.getTicketById({
    ticketId: Number(input.ticketId),
    propertiesToReturn: propertyKeys,
  })

  return {
    ticket: {
      ..._mapHsTicketToBpTicket(ticket),
      pipeline: { id: ticket.pipeline.id, label: ticket.pipeline.label },
      pipelineStage: { id: ticket.pipelineStage.id, label: ticket.pipelineStage.label },
    },
  }
}

export const updateTicket: bp.IntegrationProps['actions']['updateTicket'] = async ({ client, ctx, input, logger }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx, logger })

  const updatedTicket = await hsClient.updateTicket({
    ticketId: input.ticketId,
    subject: input.subject,
    category: input.category,
    source: input.source,
    description: input.description,
    additionalProperties: propertiesEntriesToRecord(input.properties ?? []),
    pipelineNameOrId: input.pipeline,
    pipelineStageNameOrId: input.pipelineStage,
    priority: input.priority,
    ticketOwnerEmailOrId: input.ticketOwner,
  })

  return {
    ticket: {
      ..._mapHsTicketToBpTicket(updatedTicket),
      subject: updatedTicket.properties.subject ?? undefined,
      category: updatedTicket.properties.hs_ticket_category ?? undefined,
      description: updatedTicket.properties.content ?? undefined,
      priority: updatedTicket.properties.hs_ticket_priority ?? undefined,
      source: updatedTicket.properties.source_type ?? undefined,
    },
  }
}

export const deleteTicket: bp.IntegrationProps['actions']['deleteTicket'] = async ({ client, ctx, input, logger }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx, logger })

  await hsClient.deleteTicket({ ticketId: input.ticketId })

  return {}
}

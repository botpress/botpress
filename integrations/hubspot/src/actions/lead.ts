import { z } from '@botpress/sdk'
import { leadSchema } from '../../definitions/actions/lead'
import { getAuthenticatedHubspotClient, propertiesEntriesToRecord } from '../utils'
import * as bp from '.botpress'

type HubspotClient = Awaited<ReturnType<typeof getAuthenticatedHubspotClient>>
type HsLead = Awaited<ReturnType<HubspotClient['getLeadById']>>
type BpLead = z.infer<typeof leadSchema>

const _mapHsLeadToBpLead = (hsLead: HsLead): BpLead => ({
  id: hsLead.id,
  name: hsLead.properties.hs_lead_name ?? '',
  createdAt: hsLead.createdAt.toISOString(),
  updatedAt: hsLead.updatedAt.toISOString(),
  properties: hsLead.properties,
})

export const searchLead: bp.IntegrationProps['actions']['searchLead'] = async ({ client, ctx, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx })

  const lead = await hsClient.searchLead({ name: input.name, propertiesToReturn: input.properties })

  return {
    lead: _mapHsLeadToBpLead(lead),
  }
}

export const createLead: bp.IntegrationProps['actions']['createLead'] = async ({ client, ctx, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx })

  const lead = await hsClient.createLead({
    name: input.name,
    contactEmailOrId: input.contact,
    properties: propertiesEntriesToRecord(input.properties ?? []),
  })

  return {
    lead: _mapHsLeadToBpLead(lead),
  }
}

export const getLead: bp.IntegrationProps['actions']['getLead'] = async ({ client, ctx, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx })

  const lead = await hsClient.getLeadById({ leadId: input.leadId, propertiesToReturn: input.properties })

  return {
    lead: _mapHsLeadToBpLead(lead),
  }
}

export const updateLead: bp.IntegrationProps['actions']['updateLead'] = async ({ client, ctx, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx })

  const lead = await hsClient.updateLead({
    leadId: input.leadId,
    name: input.name,
    properties: propertiesEntriesToRecord(input.properties ?? []),
  })

  return {
    lead: {
      ..._mapHsLeadToBpLead(lead),
      name: lead.properties.hs_lead_name ?? undefined,
    },
  }
}

export const deleteLead: bp.IntegrationProps['actions']['deleteLead'] = async ({ client, ctx, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx })

  await hsClient.deleteLead({ leadId: input.leadId })

  return {}
}

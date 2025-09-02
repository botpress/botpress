import { getAccessToken } from '../auth'
import { HubspotClient } from '../hubspot-api'
import * as bp from '.botpress'

const leadDefaultProperties = [
  'hs_lead_name',
  'hs_pipeline_stage',
  'hs_createdate',
  'hs_lastmodifieddate',
  'hs_lead_name',
  'hs_lead_name_calculated',
  'hs_object_id',
  'hs_object_source',
  'hs_object_source_id',
  'hs_object_source_label',
  'hs_pipeline',
  'hs_pipeline_stage',
  'hs_pipeline_stage_last_updated',
  'hs_primary_associated_object_name',
]

export const searchLead: bp.IntegrationProps['actions']['searchLead'] = async ({ client, ctx, input }) => {
  const hsClient = new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })

  const lead = await hsClient.searchLead({ name: input.name, propertiesToReturn: leadDefaultProperties })

  return {
    lead: {
      id: lead.id,
      name: lead.properties.hs_lead_name ?? '',
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      properties: lead.properties,
    },
  }
}

export const createLead: bp.IntegrationProps['actions']['createLead'] = async ({ client, ctx, input }) => {
  const hsClient = new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })

  const lead = await hsClient.createLead({ properties: input.properties, associations: input.associations })

  return {
    lead: {
      id: lead.id,
      name: lead.properties.hs_lead_name ?? '',
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      properties: lead.properties,
    },
  }
}

export const getLead: bp.IntegrationProps['actions']['getLead'] = async ({ client, ctx, input }) => {
  const hsClient = new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })

  const lead = await hsClient.getLeadById({ leadId: input.leadId, propertiesToReturn: leadDefaultProperties })

  return {
    lead: {
      id: lead.id,
      name: lead.properties.hs_lead_name ?? '',
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      properties: lead.properties,
    },
  }
}

export const updateLead: bp.IntegrationProps['actions']['updateLead'] = async ({ client, ctx, input }) => {
  const hsClient = new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })

  const lead = await hsClient.updateLead({ leadId: input.leadId, properties: input.properties })

  return {
    lead: {
      id: lead.id,
      name: lead.properties.hs_lead_name ?? '',
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      properties: lead.properties,
    },
  }
}

export const deleteLead: bp.IntegrationProps['actions']['deleteLead'] = async ({ client, ctx, input }) => {
  const hsClient = new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })

  await hsClient.deleteLead({ leadId: input.leadId })

  return {}
}

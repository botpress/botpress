import { getAccessToken } from '../auth'
import { HubspotClient } from '../hubspot-api'
import * as bp from '.botpress'

const dealDefaultProperties = [
  'dealname',
  'pipeline',
  'dealstage',
  'closedate',
  'amount',
  'hubspot_owner_id',
  'createdate',
  'hs_lastmodifieddate',
  'hs_lastactivitydate',
  'hs_last_contacted',
  'hs_next_activity_date',
  'num_associated_contacts',
]

export const searchDeal: bp.IntegrationProps['actions']['searchDeal'] = async ({ client, ctx, input }) => {
  const hsClient = new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })

  const deal = await hsClient.searchDeal({ name: input.name })

  return {
    deal: {
      id: deal.id,
      name: deal.properties.dealname ?? '',
      createdAt: deal.createdAt.toISOString(),
      updatedAt: deal.updatedAt.toISOString(),
      properties: deal.properties,
    },
  }
}

export const createDeal: bp.IntegrationProps['actions']['createDeal'] = async ({ client, ctx, input }) => {
  const hsClient = new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })

  const deal = await hsClient.createDeal({ properties: input.properties })

  return {
    deal: {
      id: deal.id,
      name: deal.properties.dealname ?? '',
      createdAt: deal.createdAt.toISOString(),
      updatedAt: deal.updatedAt.toISOString(),
      properties: deal.properties,
    },
  }
}

export const getDeal: bp.IntegrationProps['actions']['getDeal'] = async ({ client, ctx, input }) => {
  const hsClient = new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })

  const deal = await hsClient.getDealById({ dealId: input.dealId, propertiesToReturn: dealDefaultProperties })

  return {
    deal: {
      id: deal.id,
      name: deal.properties.dealname ?? '',
      createdAt: deal.createdAt.toISOString(),
      updatedAt: deal.updatedAt.toISOString(),
      properties: deal.properties,
    },
  }
}

export const updateDeal: bp.IntegrationProps['actions']['updateDeal'] = async ({ client, ctx, input }) => {
  console.log(input)

  const hsClient = new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })

  const deal = await hsClient.updateDealById({ dealId: input.dealId, properties: input.properties })

  return {
    deal: {
      id: deal.id,
      name: deal.properties.dealname ?? '',
      createdAt: deal.createdAt.toISOString(),
      updatedAt: deal.updatedAt.toISOString(),
      properties: deal.properties,
    },
  }
}

export const deleteDeal: bp.IntegrationProps['actions']['deleteDeal'] = async ({ client, ctx, input }) => {
  const hsClient = new HubspotClient({ accessToken: await getAccessToken({ client, ctx }), client, ctx })

  await hsClient.deleteDealById({ dealId: input.dealId })

  return {}
}

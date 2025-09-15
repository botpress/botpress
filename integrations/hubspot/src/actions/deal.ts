import { z } from '@botpress/sdk'
import { dealSchema } from '../../definitions/actions/deal'
import { getAuthenticatedHubspotClient, propertiesEntriesToRecord } from '../utils'
import * as bp from '.botpress'

type HubspotClient = Awaited<ReturnType<typeof getAuthenticatedHubspotClient>>
type HsDeal = Awaited<ReturnType<HubspotClient['getDealById']>>
type BpDeal = z.infer<typeof dealSchema>

const _mapHsDealToBpDeal = (hsDeal: HsDeal): BpDeal => ({
  id: hsDeal.id,
  name: hsDeal.properties.dealname ?? '',
  createdAt: hsDeal.createdAt.toISOString(),
  updatedAt: hsDeal.updatedAt.toISOString(),
  properties: hsDeal.properties,
})

export const searchDeal: bp.IntegrationProps['actions']['searchDeal'] = async ({ client, ctx, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx })

  const deal = await hsClient.searchDeal({ name: input.name, propertiesToReturn: input.properties })

  return {
    deal: _mapHsDealToBpDeal(deal),
  }
}

export const createDeal: bp.IntegrationProps['actions']['createDeal'] = async ({ client, ctx, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx })

  const deal = await hsClient.createDeal({
    name: input.name,
    properties: propertiesEntriesToRecord(input.properties ?? []),
  })

  return {
    deal: _mapHsDealToBpDeal(deal),
  }
}

export const getDeal: bp.IntegrationProps['actions']['getDeal'] = async ({ client, ctx, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx })

  const deal = await hsClient.getDealById({ dealId: input.dealId, propertiesToReturn: input.properties })

  return {
    deal: _mapHsDealToBpDeal(deal),
  }
}

export const updateDeal: bp.IntegrationProps['actions']['updateDeal'] = async ({ client, ctx, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx })

  const deal = await hsClient.updateDealById({
    dealId: input.dealId,
    name: input.name,
    properties: propertiesEntriesToRecord(input.properties ?? []),
  })

  return {
    deal: {
      ..._mapHsDealToBpDeal(deal),
      name: deal.properties.dealname ?? undefined,
    },
  }
}

export const deleteDeal: bp.IntegrationProps['actions']['deleteDeal'] = async ({ client, ctx, input }) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx })

  await hsClient.deleteDealById({ dealId: input.dealId })

  return {}
}

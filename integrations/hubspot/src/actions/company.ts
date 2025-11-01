import { z } from '@botpress/sdk'
import { companySchema } from '../../definitions/actions/company'
import { getAuthenticatedHubspotClient } from '../utils'
import * as bp from '.botpress'

type HubspotClient = Awaited<ReturnType<typeof getAuthenticatedHubspotClient>>
type HsCompany = NonNullable<Awaited<ReturnType<HubspotClient['searchCompany']>>>
type BpCompany = z.infer<typeof companySchema>

const _mapHsCompanyToBpCompany = (hsCompany: HsCompany): BpCompany => ({
  id: hsCompany.id,
  name: hsCompany.properties['name'] ?? '',
  domain: hsCompany.properties['domain'] ?? '',
  createdAt: hsCompany.createdAt.toISOString(),
  updatedAt: hsCompany.updatedAt.toISOString(),
  properties: hsCompany.properties,
})

const _getCompanyPropertyKeys = async (hsClient: HubspotClient) => {
  const properties = await hsClient.getAllObjectProperties('companies')
  return properties.results.map((property) => property.name)
}

export const searchCompany: bp.IntegrationProps['actions']['searchCompany'] = async ({
  client,
  ctx,
  input,
  logger,
}) => {
  const hsClient = await getAuthenticatedHubspotClient({ client, ctx, logger })
  const propertyKeys = await _getCompanyPropertyKeys(hsClient)

  const company = await hsClient.searchCompany({
    name: input.name,
    domain: input.domain,
    propertiesToReturn: propertyKeys,
  })

  return {
    company: company ? _mapHsCompanyToBpCompany(company) : undefined,
  }
}

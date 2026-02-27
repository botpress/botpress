import { z } from '@botpress/sdk'
import { companySchema } from '../../definitions/actions/company'
import { getAuthenticatedHubspotClient, propertiesEntriesToRecord } from '../utils'
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
  // Don't fetch all properties to avoid 414 URI Too Long errors
  const company = await hsClient.searchCompany({
    name: input.name,
    domain: input.domain,
    propertiesToReturn: [], // Empty array = only default properties
  })

  return {
    company: company ? _mapHsCompanyToBpCompany(company) : undefined,
  }
}

export const getCompany: bp.IntegrationProps['actions']['getCompany'] = async ({ ctx, client, input, logger }) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client, logger })

  // Convert string to number if needed
  const companyId = typeof input.companyId === 'string' ? parseInt(input.companyId, 10) : input.companyId

  // Don't fetch all properties to avoid 414 URI Too Long errors
  const company = await hsClient.getCompanyById({
    companyId,
    propertiesToReturn: [], // Empty array = only default properties
  })

  return {
    company: _mapHsCompanyToBpCompany(company),
  }
}

export const updateCompany: bp.IntegrationProps['actions']['updateCompany'] = async ({
  ctx,
  client,
  input,
  logger,
}) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client, logger })

  // Convert string to number if needed
  const companyId = typeof input.companyId === 'string' ? parseInt(input.companyId, 10) : input.companyId

  const additionalProperties = propertiesEntriesToRecord(input.properties ?? [])

  const updatedCompany = await hsClient.updateCompany({
    companyId,
    additionalProperties,
  })

  // v2 API returns different format than v3 - handle it directly
  // v2 response has properties object and string dates, not Date objects
  return {
    company: {
      id: String(updatedCompany.companyId || updatedCompany.vid || companyId),
      name: updatedCompany.properties?.name?.value ?? '',
      domain: updatedCompany.properties?.domain?.value ?? '',
      createdAt: typeof updatedCompany.properties?.createdate?.value === 'string'
        ? updatedCompany.properties.createdate.value
        : new Date().toISOString(),
      updatedAt: typeof updatedCompany.properties?.hs_lastmodifieddate?.value === 'string'
        ? updatedCompany.properties.hs_lastmodifieddate.value
        : new Date().toISOString(),
      properties: Object.fromEntries(
        Object.entries(updatedCompany.properties || {}).map(([key, prop]: [string, any]) => [
          key,
          prop?.value ?? null,
        ])
      ),
    },
  }
}

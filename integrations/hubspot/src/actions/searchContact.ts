import { RuntimeError } from '@botpress/sdk'
import { Client as HubspotClient } from '@hubspot/api-client'
// FIXME: We shouldn't have to import this type but we get type errors when using literals directly
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/contacts'
import { getAccessToken } from '../auth'
import * as bp from '.botpress'

type SearchRequest = Parameters<HubspotClient['crm']['contacts']['searchApi']['doSearch']>[0]
type Filter = NonNullable<SearchRequest['filterGroups']>[number]['filters'][number]

export const searchContact: bp.IntegrationProps['actions']['searchContact'] = async ({ ctx, input, logger }) => {
  const accessToken = await getAccessToken({ ctx })
  const hsClient = new HubspotClient({ accessToken })
  const filters: Filter[] = []
  if (input.phone) {
    filters.push({
      propertyName: 'phone',
      operator: FilterOperatorEnum.Eq,
      value: input.phone.trim(),
    })
  }
  if (input.email) {
    filters.push({
      propertyName: 'email',
      operator: FilterOperatorEnum.Eq,
      value: input.email.trim(),
    })
  }
  if (!filters.length) {
    throw new RuntimeError('No filters provided')
  }

  const phoneStr = input.phone ? `phone ${input.phone}` : 'unknown phone'
  const emailStr = input.email ? `email ${input.email}` : 'unknown email'
  const infosStr = `${phoneStr} and ${emailStr}`
  logger
    .forBot()
    .debug(
      `Searching for contact with ${infosStr} ${input.properties?.length ? `and properties ${input.properties?.join(', ')}` : ''}`
    )
  const contacts = await hsClient.crm.contacts.searchApi.doSearch({
    filterGroups: [
      {
        filters,
      },
    ],
    properties: [
      // Builtin properties normally returned by API
      'createdate',
      'email',
      'firstname',
      'lastmodifieddate',
      'lastname',
      'phone',
      ...(input.properties ?? []),
    ],
  })
  const hsContact = contacts.results[0]
  const contact = hsContact
    ? {
        id: hsContact.id,
        properties: hsContact.properties,
      }
    : undefined
  return {
    contact,
  }
}

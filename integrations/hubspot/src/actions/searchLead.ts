import { RuntimeError } from '@botpress/sdk'
import { Client as HubspotClient } from '@hubspot/api-client'
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/objects/leads'
import { getAccessToken } from '../auth'
import * as bp from '.botpress'

type SearchRequest = Parameters<HubspotClient['crm']['objects']['leads']['searchApi']['doSearch']>[0]
type Filter = NonNullable<SearchRequest['filterGroups']>[number]['filters'][number]

export const searchLead: bp.IntegrationProps['actions']['searchLead'] = async ({ ctx, input }) => {
  const accessToken = await getAccessToken({ ctx })
  const hsClient = new HubspotClient({ accessToken })

  const filters: Filter[] = []

  if (input.name) {
    filters.push({
      propertyName: 'hs_lead_name',
      operator: FilterOperatorEnum.ContainsToken,
      value: input.name.trim(),
    })
  }

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

  const leads = await hsClient.crm.objects.leads.searchApi
    .doSearch({
      filterGroups: [
        {
          filters,
        },
      ],
    })
    .catch((error) => {
      console.error(error)
    })

  console.log(leads)

  const lead = leads?.results?.[0]

  return { lead: lead ? { id: lead.id } : undefined }
}

import { Client as HubspotClient } from '@hubspot/api-client'
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/objects/leads'

const searchLead = async (client: HubspotClient) => {
  const leads = await client.crm.objects.leads.searchApi.doSearch({
    filterGroups: [
      {
        filters: [
          {
            operator: FilterOperatorEnum.ContainsToken,
            propertyName: 'hs_lead_name',
            value: 'Andrew',
          },
        ],
      },
    ],
  })

  console.log(leads)
}

const getProperties = async (client: HubspotClient) => {
  const properties = await client.crm.properties.coreApi.getAll('lead')
  console.log(JSON.stringify(properties, null, 2))
}

const main = async () => {
  const hsClient = new HubspotClient({ accessToken: '' })
  await getProperties(hsClient)
}

void main()

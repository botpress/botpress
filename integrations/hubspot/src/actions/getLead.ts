import { Client as HubspotClient } from '@hubspot/api-client'
import { getAccessToken } from '../auth'
import * as bp from '.botpress'

export const getLead: bp.IntegrationProps['actions']['getLead'] = async ({ ctx, input }) => {
  const accessToken = await getAccessToken({ ctx })
  const hsClient = new HubspotClient({ accessToken })

  const lead = await hsClient.crm.objects.leads.basicApi.getById(input.id, [
    'hs_lead_name',
    'email',
    'phone',
    'hs_lead_status',
    'hs_lead_source',
  ])

  console.log(lead)
  return { lead: { id: lead.id } }
}

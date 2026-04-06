import { SalesforceObject } from 'src/misc/types'
import { createSalesforceRecord } from './generic/create-salesforce-record'
import { fetchSalesforceRecords } from './generic/fetch-salesforce-records'
import { updateSalesforceRecord } from './generic/update-salesforce-record'
import * as bp from '.botpress'

export const createLead: bp.IntegrationProps['actions']['createLead'] = async (props) => {
  return await createSalesforceRecord(SalesforceObject.Lead, props)
}

export const updateLead: bp.IntegrationProps['actions']['updateLead'] = async (props) => {
  return await updateSalesforceRecord(SalesforceObject.Lead, props)
}

export const searchLeads: bp.IntegrationProps['actions']['searchLeads'] = async (props) => {
  return await fetchSalesforceRecords(SalesforceObject.Lead, props)
}

export const LeadActions = {
  createLead,
  updateLead,
  searchLeads,
}

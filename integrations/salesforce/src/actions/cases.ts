import { SalesforceObject } from 'src/misc/types'
import { createSalesforceRecord } from './generic/create-salesforce-record'
import { fetchSalesforceRecords } from './generic/fetch-salesforce-records'
import { updateSalesforceRecord } from './generic/update-salesforce-record'
import * as bp from '.botpress'

export const createCase: bp.IntegrationProps['actions']['createCase'] = async (props) => {
  return await createSalesforceRecord(SalesforceObject.Case, props)
}

export const updateCase: bp.IntegrationProps['actions']['updateCase'] = async (props) => {
  return await updateSalesforceRecord(SalesforceObject.Case, props)
}

export const searchCases: bp.IntegrationProps['actions']['searchCases'] = async (props) => {
  return await fetchSalesforceRecords(SalesforceObject.Case, props)
}

export const CaseActions = {
  createCase,
  updateCase,
  searchCases,
}

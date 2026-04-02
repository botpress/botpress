import { SalesforceObject } from 'src/misc/types'
import { createSalesforceRecord } from './generic/create-salesforce-record'
import { fetchSalesforceRecords } from './generic/fetch-salesforce-records'
import { updateSalesforceRecord } from './generic/update-salesforce-record'
import * as bp from '.botpress'

export const createContact: bp.IntegrationProps['actions']['createContact'] = async (props) => {
  return await createSalesforceRecord(SalesforceObject.Contact, props)
}

export const updateContact: bp.IntegrationProps['actions']['updateContact'] = async (props) => {
  return await updateSalesforceRecord(SalesforceObject.Contact, props)
}

export const searchContacts: bp.IntegrationProps['actions']['searchContacts'] = async (props) => {
  return await fetchSalesforceRecords(SalesforceObject.Contact, props)
}

export const ContactActions = {
  createContact,
  updateContact,
  searchContacts,
}

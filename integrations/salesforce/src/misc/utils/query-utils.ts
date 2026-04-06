import { SalesforceObject } from '../types'
import * as bp from '.botpress'

type SearchInput =
  | Parameters<bp.IntegrationProps['actions']['searchCases']>['0']['input']
  | Parameters<bp.IntegrationProps['actions']['searchContacts']>['0']['input']
  | Parameters<bp.IntegrationProps['actions']['searchLeads']>['0']['input']

export const getSearchQuery = (objectType: SalesforceObject, input: SearchInput, objectFields: string): string => {
  let query = `SELECT ${objectFields} FROM ${objectType}`
  const conditions: string[] = []

  const fields = [
    { key: 'Id', operator: '=' },
    { key: 'Name', operator: 'LIKE' },
    { key: 'Email', operator: '=' },
    { key: 'Subject', operator: 'LIKE' },
    { key: 'Description', operator: 'LIKE' },
    { key: 'Status', operator: '=' },
  ]

  fields.forEach(({ key, operator }) => {
    if (input[key as keyof SearchInput]) {
      const value = operator === 'LIKE' ? `%${input[key as keyof SearchInput]}%` : input[key as keyof SearchInput]

      conditions.push(`${key} ${operator} '${value}'`)
    }
  })

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }

  return query
}

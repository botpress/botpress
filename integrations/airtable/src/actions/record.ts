import { FieldSet } from 'airtable/lib/field_set'
import type { FieldValue } from '../misc/field-schemas'
import { wrapAction } from './action-wrapper'

function toFieldSet(fields: FieldValue[]): FieldSet {
  const result: FieldSet = {}
  for (const field of fields) {
    result[field.fieldNameOrId] = field.value as FieldSet[string]
  }
  return result
}

export const createRecord = wrapAction(
  { actionName: 'createRecord', errorMessage: 'Failed to create record' },
  async ({ airtableClient, logger }, { tableIdOrName, fields }) => {
    const record = await airtableClient.createRecord(tableIdOrName, toFieldSet(fields))
    logger.forBot().info(`Successful - Create Record - ${record.id}`)
    return record
  }
)

export const updateRecord = wrapAction(
  { actionName: 'updateRecord', errorMessage: 'Failed to update record' },
  async ({ airtableClient, logger }, { tableIdOrName, recordId, fields }) => {
    const record = await airtableClient.updateRecord(tableIdOrName, recordId, toFieldSet(fields))
    logger.forBot().info(`Successful - Update Record - ${record.id}`)
    return record
  }
)

export const listRecords = wrapAction(
  { actionName: 'listRecords', errorMessage: 'Failed to list records' },
  async ({ airtableClient, logger }, { tableIdOrName, filterByFormula, nextToken }) => {
    const records = await airtableClient.listRecords({ tableIdOrName, filterByFormula, nextToken })
    logger.forBot().info(`Successful - List Records - ${tableIdOrName}`)
    return records
  }
)

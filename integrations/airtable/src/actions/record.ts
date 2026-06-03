import { FieldSet } from 'airtable/lib/field_set'
import { AirtableClient } from '../airtable-api/airtable-client'
import type { FieldValue } from '../misc/field-schemas'
import type { IntegrationProps } from '../misc/types'

function toFieldSet(fields: FieldValue[]): FieldSet {
  const result: FieldSet = {}
  for (const field of fields) {
    result[field.fieldNameOrId] = field.value as FieldSet[string]
  }
  return result
}

export const createRecord: IntegrationProps['actions']['createRecord'] = async ({ client, ctx, logger, input }) => {
  const airtableClient = await AirtableClient.createFromStates({ client, ctx, logger })
  const record = await airtableClient.createRecord(input.tableIdOrName, toFieldSet(input.fields))
  logger.forBot().info(`Successful - Create Record - ${record.id}`)
  return record
}

export const updateRecord: IntegrationProps['actions']['updateRecord'] = async ({ client, ctx, logger, input }) => {
  const airtableClient = await AirtableClient.createFromStates({ client, ctx, logger })
  const record = await airtableClient.updateRecord(input.tableIdOrName, input.recordId, toFieldSet(input.fields))
  logger.forBot().info(`Successful - Update Record - ${record.id}`)
  return record
}

export const listRecords: IntegrationProps['actions']['listRecords'] = async ({ client, ctx, logger, input }) => {
  const airtableClient = await AirtableClient.createFromStates({ client, ctx, logger })
  const records = await airtableClient.listRecords({
    tableIdOrName: input.tableIdOrName,
    filterByFormula: input.filterByFormula,
    nextToken: input.nextToken,
  })
  logger.forBot().info(`Successful - List Records - ${input.tableIdOrName}`)
  return records
}

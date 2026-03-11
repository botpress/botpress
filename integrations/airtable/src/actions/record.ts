import { RuntimeError } from '@botpress/sdk'
import { FieldSet } from 'airtable/lib/field_set'
import { AirtableApi } from '../client'
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
  const AirtableClient = new AirtableApi({ client, ctx, logger })

  try {
    logger.forBot().debug('create: ', toFieldSet(input.fields))
    const record = await AirtableClient.createRecord(input.tableIdOrName, toFieldSet(input.fields))
    logger.forBot().info(`Successful - Create Record - ${record.id}`)
    return record
  } catch (thrown) {
    logger.forBot().error(thrown instanceof Error ? thrown : new Error(String(thrown)), typeof thrown)
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to create record', error)
  }
}

export const updateRecord: IntegrationProps['actions']['updateRecord'] = async ({ client, ctx, logger, input }) => {
  const AirtableClient = new AirtableApi({ client, ctx, logger })

  try {
    logger.forBot().debug('update: ', toFieldSet(input.fields) as FieldSet)
    const record = await AirtableClient.updateRecord(input.tableIdOrName, input.recordId, toFieldSet(input.fields))
    logger.forBot().info(`Successful - Update Record - ${record.id}`)
    return record
  } catch (thrown) {
    logger.forBot().error(thrown instanceof Error ? thrown : new Error(String(thrown)), typeof thrown)
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to update record', error)
  }
}

export const listRecords: IntegrationProps['actions']['listRecords'] = async ({ client, ctx, logger, input }) => {
  const AirtableClient = new AirtableApi({ client, ctx, logger })

  try {
    const records = await AirtableClient.listRecords({
      tableIdOrName: input.tableIdOrName,
      filterByFormula: input.filterByFormula,
      nextToken: input.nextToken,
    })

    logger.forBot().info(`Successful - List Records - ${input.tableIdOrName}`)
    return records
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to list records', error)
  }
}

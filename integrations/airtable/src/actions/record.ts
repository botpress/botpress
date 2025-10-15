import { RuntimeError } from '@botpress/sdk'
import { createRecordOutputSchema, listRecordsOutputSchema, updateRecordOutputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'
import { getClient } from '../utils'

export const createRecord: IntegrationProps['actions']['createRecord'] = async ({ ctx, logger, input }) => {
  const AirtableClient = getClient(ctx.configuration)

  try {
    const record = await AirtableClient.createRecord(input.tableIdOrName, JSON.parse(input.fields))
    const validatedRecord = createRecordOutputSchema.parse(record)
    logger.forBot().info(`Successful - Create Record - ${record.id}`)
    return validatedRecord
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to create record', error)
  }
}

export const updateRecord: IntegrationProps['actions']['updateRecord'] = async ({ ctx, logger, input }) => {
  const AirtableClient = getClient(ctx.configuration)

  try {
    const output = await AirtableClient.updateRecord(input.tableIdOrName, input.recordId, JSON.parse(input.fields))
    const validatedRecord = updateRecordOutputSchema.parse(output)
    logger.forBot().info(`Successful - Update Record - ${output.id}`)
    return validatedRecord
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to update record', error)
  }
}

export const listRecords: IntegrationProps['actions']['listRecords'] = async ({ ctx, logger, input }) => {
  const AirtableClient = getClient(ctx.configuration)

  try {
    const output = await AirtableClient.listRecords({
      tableIdOrName: input.tableIdOrName,
      filterByFormula: input.filterByFormula,
      offset: input.nextToken,
    })

    const validatedRecords = listRecordsOutputSchema.parse(output)
    logger.forBot().info(`Successful - List Records - ${input.tableIdOrName}`)
    return validatedRecords
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to list records', error)
  }
}

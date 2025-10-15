import { RuntimeError } from '@botpress/sdk'
import { createRecordInputSchema, updateRecordInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'
import { getClient } from '../utils'

export const createRecord: IntegrationProps['actions']['createRecord'] = async ({ ctx, logger, input }) => {
  const validatedInput = createRecordInputSchema.parse(input)
  const AirtableClient = getClient(ctx.configuration)

  try {
    const record = await AirtableClient.createRecord(validatedInput.tableIdOrName, JSON.parse(validatedInput.fields))
    logger.forBot().info(`Successful - Create Record - ${record.id}`)
    return {
      _rawJson: record.fields,
      id: record.id,
    }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to create record', error)
  }
}

export const updateRecord: IntegrationProps['actions']['updateRecord'] = async ({ ctx, logger, input }) => {
  const validatedInput = updateRecordInputSchema.parse(input)
  const AirtableClient = getClient(ctx.configuration)

  try {
    const output = await AirtableClient.updateRecord(
      validatedInput.tableIdOrName,
      validatedInput.recordId,
      JSON.parse(validatedInput.fields)
    )
    const record = {
      _rawJson: output.fields,
      id: output.id,
    }
    logger.forBot().info(`Successful - Update Record - ${record.id}`)
    return record
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

    const records = output.records.map((record) => ({
      _rawJson: record.fields,
      id: record.id,
    }))

    logger.forBot().info(`Successful - List Records - ${input.tableIdOrName}`)
    return { records, nextToken: output.offset }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to list records', error)
  }
}

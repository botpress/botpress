import { RuntimeError } from '@botpress/sdk'
import type { IntegrationProps } from '../misc/types'
import { getClient } from '../utils'

export const createRecord: IntegrationProps['actions']['createRecord'] = async ({ ctx, logger, input }) => {
  const AirtableClient = getClient(ctx.configuration)

  try {
    const record = await AirtableClient.createRecord(input.tableIdOrName, JSON.parse(input.fields))
    logger.forBot().info(`Successful - Create Record - ${record.id}`)
    return record
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to create record', error)
  }
}

export const updateRecord: IntegrationProps['actions']['updateRecord'] = async ({ ctx, logger, input }) => {
  const AirtableClient = getClient(ctx.configuration)

  try {
    const record = await AirtableClient.updateRecord(input.tableIdOrName, input.recordId, JSON.parse(input.fields))
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

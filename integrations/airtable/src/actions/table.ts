import { RuntimeError } from '@botpress/sdk'
import { AirtableApi } from '../client'
import type { IntegrationProps } from '../misc/types'

export const createTable: IntegrationProps['actions']['createTable'] = async ({ client, ctx, logger, input }) => {
  const AirtableClient = new AirtableApi({ client, ctx, logger })

  try {
    const table = await AirtableClient.createTable(input.name, input.fields, input.description)
    logger.forBot().info(`Successful - Create Table - ${table.id} - ${table.name}`)
    return table
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to create table', error)
  }
}

export const updateTable: IntegrationProps['actions']['updateTable'] = async ({ client, ctx, logger, input }) => {
  const AirtableClient = new AirtableApi({ client, ctx, logger })

  try {
    const table = await AirtableClient.updateTable(input.tableIdOrName, input.name, input.description)
    logger.forBot().info(`Successful - Update Table - ${table.id} - ${table.name}`)
    return table
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to update table', error)
  }
}

export const getTableRecords: IntegrationProps['actions']['getTableRecords'] = async ({
  client,
  ctx,
  logger,
  input,
}) => {
  const AirtableClient = new AirtableApi({ client, ctx, logger })
  try {
    const records = await AirtableClient.listRecords({
      tableIdOrName: input.tableIdOrName,
      nextToken: input.nextToken,
    })

    logger.forBot().info(`Successful - Get Table Records - ${input.tableIdOrName}`)
    return records
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to get table records', error)
  }
}

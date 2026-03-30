import { AirtableApi } from '../client'
import type { IntegrationProps } from '../misc/types'

export const createTable: IntegrationProps['actions']['createTable'] = async ({ client, ctx, logger, input }) => {
  const airtableClient = new AirtableApi({ client, ctx, logger })
  const table = await airtableClient.createTable(input.name, input.fields, input.description)
  logger.forBot().info(`Successful - Create Table - ${table.id} - ${table.name}`)
  return table
}

export const updateTable: IntegrationProps['actions']['updateTable'] = async ({ client, ctx, logger, input }) => {
  const airtableClient = new AirtableApi({ client, ctx, logger })
  const table = await airtableClient.updateTable(input.tableIdOrName, input.name, input.description)
  logger.forBot().info(`Successful - Update Table - ${table.id} - ${table.name}`)
  return table
}

export const getTableRecords: IntegrationProps['actions']['getTableRecords'] = async ({ client, ctx, logger, input }) => {
  const airtableClient = new AirtableApi({ client, ctx, logger })
  const records = await airtableClient.listRecords({
    tableIdOrName: input.tableIdOrName,
    nextToken: input.nextToken,
  })
  logger.forBot().info(`Successful - Get Table Records - ${input.tableIdOrName}`)
  return records
}

import { wrapAction } from './action-wrapper'

export const createTable = wrapAction(
  { actionName: 'createTable', errorMessage: 'Failed to create table' },
  async ({ airtableClient, logger }, { name, fields, description }) => {
    const table = await airtableClient.createTable(name, fields, description)
    logger.forBot().info(`Successful - Create Table - ${table.id} - ${table.name}`)
    return table
  }
)

export const updateTable = wrapAction(
  { actionName: 'updateTable', errorMessage: 'Failed to update table' },
  async ({ airtableClient, logger }, { tableIdOrName, name, description }) => {
    const table = await airtableClient.updateTable(tableIdOrName, name, description)
    logger.forBot().info(`Successful - Update Table - ${table.id} - ${table.name}`)
    return table
  }
)

export const getTableRecords = wrapAction(
  { actionName: 'getTableRecords', errorMessage: 'Failed to get table records' },
  async ({ airtableClient, logger }, { tableIdOrName, nextToken }) => {
    const records = await airtableClient.listRecords({ tableIdOrName, nextToken })
    logger.forBot().info(`Successful - Get Table Records - ${tableIdOrName}`)
    return records
  }
)

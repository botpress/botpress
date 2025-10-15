import { RuntimeError } from '@botpress/sdk'
import {
  createTableInputSchema,
  createTableOutputSchema,
  getTableRecordsInputSchema,
  getTableRecordsOutputSchema,
  updateTableInputSchema,
  updateTableOutputSchema,
} from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'
import { fieldsStringToArray, getClient } from '../utils'

export const createTable: IntegrationProps['actions']['createTable'] = async ({ ctx, logger, input }) => {
  const validatedInput = createTableInputSchema.parse(input)
  const AirtableClient = getClient(ctx.configuration)

  try {
    const table = await AirtableClient.createTable(
      validatedInput.name,
      fieldsStringToArray(validatedInput.fields),
      validatedInput.description
    )

    const validatedTable = createTableOutputSchema.parse(table)
    logger.forBot().info(`Successful - Create Table - ${table.id} - ${table.name}`)
    return validatedTable
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to create table', error)
  }
}

export const updateTable: IntegrationProps['actions']['updateTable'] = async ({ ctx, logger, input }) => {
  const validatedInput = updateTableInputSchema.parse(input)
  const AirtableClient = getClient(ctx.configuration)

  try {
    const table = await AirtableClient.updateTable(
      validatedInput.tableIdOrName,
      validatedInput.name,
      validatedInput.description
    )

    const validatedTable = updateTableOutputSchema.parse(table)
    logger.forBot().info(`Successful - Update Table - ${table.id} - ${table.name}`)
    return validatedTable
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to update table', error)
  }
}

export const getTableRecords: IntegrationProps['actions']['getTableRecords'] = async ({ ctx, logger, input }) => {
  const validatedInput = getTableRecordsInputSchema.parse(input)
  const AirtableClient = getClient(ctx.configuration)
  try {
    const output = await AirtableClient.getTableRecords(validatedInput.tableIdOrName)
    const records = output.map((record) => {
      return {
        _rawJson: record.fields,
        id: record.id,
      }
    })
    const validatedRecords = getTableRecordsOutputSchema.parse(records)
    logger.forBot().info(`Successful - Get Table Records - ${validatedInput.tableIdOrName}`)
    return validatedRecords
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to get table records', error)
  }
}

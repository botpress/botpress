import { createTableInputSchema, getTableRecordsInputSchema, updateTableInputSchema } from '../misc/custom-schemas'
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
    logger.forBot().info(`Successful - Create Table - ${table.id} - ${table.name}`)
    return table
  } catch (error) {
    logger.forBot().debug(`'Create Table' exception ${JSON.stringify(error)}`)
    return {}
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
    logger.forBot().info(`Successful - Update Table - ${table.id} - ${table.name}`)
    return table
  } catch (error) {
    logger.forBot().debug(`'Update Table' exception ${JSON.stringify(error)}`)
    return {}
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
    logger.forBot().info(`Successful - Get Table Records - ${validatedInput.tableIdOrName}`)
    return { records }
  } catch (error) {
    logger.forBot().debug(`'Get Table Records' exception ${JSON.stringify(error)}`)
    return { records: [] }
  }
}

import { createTableInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { fieldsStringToArray, getClient } from '../utils'

export const createTable: Implementation['actions']['createTable'] = async ({
  ctx,
  logger,
  input,
}) => {
  const validatedInput = createTableInputSchema.parse(input)
  const AirtableClient = getClient(ctx.configuration)
  let table
  try {
    table = await AirtableClient.createTable(
      validatedInput.name,
      fieldsStringToArray(validatedInput.fields),
      validatedInput.description
    )
    logger
      .forBot()
      .info(`Successful - Create Table - ${table.id} - ${table.name}`)
  } catch (error) {
    table = {}
    logger.forBot().debug(`'Create Table' exception ${JSON.stringify(error)}`)
  }

  return table
}

import { createTableInputSchema } from '../misc/custom-schemas'
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

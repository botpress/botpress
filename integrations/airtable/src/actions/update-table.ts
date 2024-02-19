import { updateTableInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'
import { getClient } from '../utils'

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

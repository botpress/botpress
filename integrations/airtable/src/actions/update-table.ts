import type { Implementation } from '../misc/types'
import { updateTableInputSchema } from '../misc/custom-schemas'
import { getClient } from '../utils'

export const updateTable: Implementation['actions']['updateTable'] = async ({
  ctx,
  logger,
  input,
}) => {
  const validatedInput = updateTableInputSchema.parse(input)
  const AirtableClient = getClient(ctx.configuration)
  let table
  try {
    table = await AirtableClient.updateTable(
      validatedInput.tableIdOrName,
      validatedInput.name,
      validatedInput.description
    )
    logger
      .forBot()
      .info(`Successful - Update Table - ${table.id} - ${table.name}`)
  } catch (error) {
    table = {}
    logger.forBot().debug(`'Update Table' exception ${JSON.stringify(error)}`)
  }

  return table
}

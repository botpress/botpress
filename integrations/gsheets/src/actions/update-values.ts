import { updateValuesInputSchema } from 'src/misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { getClient } from '../utils'

export const updateValues: Implementation['actions']['updateValues'] = async ({ ctx, input, logger }) => {
  const validatedInput = updateValuesInputSchema.parse(input)
  const GoogleSheetsClient = getClient(ctx.configuration)
  let response

  try {
    response = await GoogleSheetsClient.updateValues(validatedInput.range, validatedInput.values)
    logger.forBot().info(`Successful - Update Values - ${response?.updatedRange}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Update Values' exception ${error}`)
  }

  return response
}

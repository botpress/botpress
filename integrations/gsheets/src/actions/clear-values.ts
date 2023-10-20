import { clearValuesInputSchema } from 'src/misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { getClient } from '../client'

export const clearValues: Implementation['actions']['clearValues'] = async ({ ctx, input, logger }) => {
  const validatedInput = clearValuesInputSchema.parse(input)
  const GoogleSheetsClient = getClient(ctx.configuration)
  let response

  try {
    response = await GoogleSheetsClient.clearValues(validatedInput.range)
    logger.forBot().info(`Successful - Clear Values - ${response?.clearedRange}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Clear Values' exception ${error}`)
  }

  return response
}

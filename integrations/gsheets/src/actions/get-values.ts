import { getValuesInputSchema } from 'src/misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { getClient } from '../utils'

export const getValues: Implementation['actions']['getValues'] = async ({ ctx, input, logger }) => {
  const validatedInput = getValuesInputSchema.parse(input)
  const GoogleSheetsClient = getClient(ctx.configuration)
  let response

  try {
    response = await GoogleSheetsClient.getValues(validatedInput.range)
    logger.forBot().info(`Successful - Get Values - ${response?.range}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Get Values' exception ${error}`)
  }

  return response
}

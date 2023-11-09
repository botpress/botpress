import { appendValuesInputSchema } from 'src/misc/custom-schemas'
import { getClient } from '../client'
import type { Implementation } from '../misc/types'

export const appendValues: Implementation['actions']['appendValues'] = async ({ ctx, input, logger }) => {
  const validatedInput = appendValuesInputSchema.parse(input)
  const GoogleSheetsClient = getClient(ctx.configuration)
  let response

  try {
    response = await GoogleSheetsClient.appendValues(validatedInput.range, validatedInput.values)
    logger.forBot().info(`Successful - Append Values - ${response?.updates?.updatedRange}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Append Values' exception ${error}`)
  }

  return response
}

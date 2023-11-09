import { getClient } from '../client'
import type { Implementation } from '../misc/types'

export const appendValues: Implementation['actions']['appendValues'] = async ({ ctx, input, logger }) => {
  const GoogleSheetsClient = getClient(ctx.configuration)
  let response

  try {
    response = await GoogleSheetsClient.appendValues(input.range, input.values)
    logger.forBot().info(`Successful - Append Values - ${response?.updates?.updatedRange}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Append Values' exception ${error}`)
  }

  return response
}

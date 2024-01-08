import { getClient } from '../client'
import type { Implementation } from '../misc/types'

export const clearValues: Implementation['actions']['clearValues'] = async ({ ctx, input, logger }) => {
  const GoogleSheetsClient = getClient(ctx.configuration)
  let response

  try {
    response = await GoogleSheetsClient.clearValues(input.range)
    logger.forBot().info(`Successful - Clear Values - ${response?.clearedRange}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Clear Values' exception ${error}`)
  }

  return response
}

import { getClient } from '../client'
import type { IntegrationProps } from '../misc/types'

export const clearValues: IntegrationProps['actions']['clearValues'] = async ({ ctx, input, logger }) => {
  logger.forBot().debug('Calling action "clearValues" with input:', input)
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

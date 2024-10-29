import { getClient } from '../client'
import * as bp from '.botpress'

export const clearValues: bp.IntegrationProps['actions']['clearValues'] = async ({ ctx, input, logger }) => {
  logger.forBot().debug('Calling action "clearValues" with input:', input)
  const GoogleSheetsClient = getClient(ctx.configuration)
  let response

  try {
    response = await GoogleSheetsClient.clearValues(input.range, input.majorDimension)
    logger.forBot().info(`Successful - Clear Values - ${response?.clearedRange}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Clear Values' exception ${error}`)
  }

  return response
}

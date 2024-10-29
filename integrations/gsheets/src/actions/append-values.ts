import { getClient } from '../client'
import * as bp from '.botpress'

export const appendValues: bp.IntegrationProps['actions']['appendValues'] = async ({ ctx, input, logger }) => {
  logger.forBot().debug('Calling action "appendValues" with input:', input)
  const GoogleSheetsClient = getClient(ctx.configuration)
  let response

  try {
    response = await GoogleSheetsClient.appendValues(input.range, input.values, input.majorDimension)
    logger.forBot().info(`Successful - Append Values - ${response?.updates?.updatedRange}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Append Values' exception ${error}`)
  }

  return response
}

import { getClient } from '../client'
import * as bp from '.botpress'

export const updateValues: bp.IntegrationProps['actions']['updateValues'] = async ({ ctx, input, logger }) => {
  logger.forBot().debug('Calling action "updateValues" with input: ', input)
  const GoogleSheetsClient = getClient(ctx.configuration)
  let response

  try {
    response = await GoogleSheetsClient.updateValues(input.range, input.values, input.majorDimension)
    logger.forBot().info(`Successful - Update Values - ${response?.updatedRange}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Update Values' exception ${error}`)
  }

  return response
}

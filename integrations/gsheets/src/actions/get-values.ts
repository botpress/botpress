import { getClient } from '../client'
import * as bp from '.botpress'

export const getValues: bp.IntegrationProps['actions']['getValues'] = async ({ ctx, input, logger }) => {
  logger.forBot().debug('Calling action "getValues" with input: ', input)
  const GoogleSheetsClient = getClient(ctx.configuration)
  let response

  try {
    response = await GoogleSheetsClient.getValues(input.range, input.majorDimension)
    logger.forBot().info(`Successful - Get Values - ${response?.range}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Get Values' exception ${error}`)
  }

  return {
    ...response,
    majorDimension: response.majorDimension === 'COLUMNS' ? 'COLUMNS' : 'ROWS',
  }
}

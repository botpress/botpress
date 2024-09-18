import { getClient } from '../client'
import type { IntegrationProps } from '../misc/types'

export const getValues: IntegrationProps['actions']['getValues'] = async ({ ctx, input, logger }) => {
  logger.forBot().debug('Calling action "getValues" with input: ', input)
  const GoogleSheetsClient = getClient(ctx.configuration)
  let response

  try {
    response = await GoogleSheetsClient.getValues(input.range)
    logger.forBot().info(`Successful - Get Values - ${response?.range}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Get Values' exception ${error}`)
  }

  return response
}

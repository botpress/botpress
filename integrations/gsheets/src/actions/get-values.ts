import { getClient } from '../client'
import type { Implementation } from '../misc/types'

export const getValues: Implementation['actions']['getValues'] = async ({ ctx, input, logger }) => {
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

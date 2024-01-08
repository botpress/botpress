import { getClient } from '../client'
import type { Implementation } from '../misc/types'

export const updateValues: Implementation['actions']['updateValues'] = async ({ ctx, input, logger }) => {
  const GoogleSheetsClient = getClient(ctx.configuration)
  let response

  try {
    response = await GoogleSheetsClient.updateValues(input.range, input.values)
    logger.forBot().info(`Successful - Update Values - ${response?.updatedRange}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Update Values' exception ${error}`)
  }

  return response
}

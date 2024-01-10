import { getClient } from '../client'
import type { Implementation } from '../misc/types'

export const addSheet: Implementation['actions']['addSheet'] = async ({ ctx, input, logger }) => {
  logger.forBot().debug('Calling action "addSheet" with input:', input)
  const GoogleSheetsClient = getClient(ctx.configuration)

  const requests = [
    {
      addSheet: {
        properties: {
          title: input.title,
        },
      },
    },
  ]

  let response

  try {
    response = await GoogleSheetsClient.batchUpdate(requests)
    logger.forBot().info('Successful - Add Sheet}')
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Add Sheet' exception ${error}`)
  }

  return response
}

import { findUserInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

import { getClient } from '../utils'

export const findUser: IntegrationProps['actions']['findUser'] = async ({ ctx, input, logger }) => {
  const validatedInput = findUserInputSchema.parse(input)
  const asanaClient = getClient(ctx.configuration)
  let response
  try {
    response = await asanaClient.findUser(validatedInput.userEmail)
    logger.forBot().info(`Successful - Find User - ${response.name}`)
  } catch (error) {
    logger.forBot().debug(`'Find User' exception ${JSON.stringify(error)}`)
    response = {}
  }
  return response
}

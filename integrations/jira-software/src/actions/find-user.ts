import {
  findUserInputSchema,
  findUserOutputSchema,
} from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient } from '../utils'

export const findUser: Implementation['actions']['findUser'] = async ({
  ctx,
  input,
  logger,
}) => {
  const validatedInput = findUserInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)
  let response
  try {
    response = await jiraClient.findUser(validatedInput.accountId)
    logger
      .forBot()
      .info(
        `Successful - Find User - ${
          response?.displayName || 'Unknown'
        } - with ID: ${validatedInput.accountId}`
      )
  } catch (error) {
    logger.forBot().debug(`'Find User' exception ${JSON.stringify(error)}`)
    response = {}
  }
  return findUserOutputSchema.parse(response)
}

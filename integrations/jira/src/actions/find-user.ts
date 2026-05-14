import { RuntimeError } from '@botpress/sdk'
import { findUserInputSchema, findUserOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient, getErrorMessage, serializeErrorForLog } from '../utils'

export const findUser: Implementation['actions']['findUser'] = async ({ ctx, input, logger }) => {
  const validatedInput = findUserInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)
  try {
    const response = await jiraClient.findUser(validatedInput.query)
    logger
      .forBot()
      .info(`Successful - Find User - ${response?.displayName || 'Unknown'} - with query: ${validatedInput.query}`)
    return findUserOutputSchema.parse({
      ...response,
      active: response.active ?? false,
    })
  } catch (error) {
    logger.forBot().debug(`'Find User' exception ${serializeErrorForLog(error)}`)
    const message = getErrorMessage(error)
    throw new RuntimeError(`Failed to find user: ${message}`)
  }
}

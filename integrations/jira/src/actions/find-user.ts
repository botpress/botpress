import { RuntimeError } from '@botpress/sdk'
import { findUserInputSchema, findUserOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient, getJiraErrorDetail } from '../utils'

export const findUser: Implementation['actions']['findUser'] = async ({ ctx, input, logger }) => {
  const validatedInput = findUserInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)
  let response
  try {
    response = await jiraClient.findUser(validatedInput.query)
    logger
      .forBot()
      .info(`Successful - Find User - ${response?.displayName || 'Unknown'} - with query: ${validatedInput.query}`)
  } catch (error) {
    logger.forBot().debug(`'Find User' exception ${JSON.stringify(error)}`)
    const message = getJiraErrorDetail(error) ?? (error instanceof Error ? error.message : JSON.stringify(error))
    throw new RuntimeError(`Failed to find user: ${message}`)
  }
  return findUserOutputSchema.parse({
    ...response,
    active: response.active ?? false,
  })
}

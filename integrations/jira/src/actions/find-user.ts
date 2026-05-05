import { RuntimeError } from '@botpress/sdk'
import { findUserInputSchema, findUserOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient } from '../utils'

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
    const jiraError = error as {
      errorMessages?: string[]
      errors?: Record<string, string>
      status?: number
      statusText?: string
    }
    const fieldErrors = jiraError?.errors ? Object.entries(jiraError.errors).map(([k, v]) => `${k}: ${v}`) : []
    const detail = [...(jiraError?.errorMessages ?? []), ...fieldErrors].join('; ')
    const message = detail || (error instanceof Error ? error.message : JSON.stringify(error))
    throw new RuntimeError(`Failed to find user: ${message}`)
  }
  return findUserOutputSchema.parse({
    ...response,
    active: response.active ?? false,
  })
}

import { RuntimeError } from '@botpress/sdk'

import { findAllUsersInputSchema, findAllUsersOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient } from '../utils'

export const findAllUsers: Implementation['actions']['findAllUsers'] = async ({ ctx, input, logger }) => {
  const validatedInput = findAllUsersInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)
  const addParams = {
    startAt: Number(validatedInput?.startAt || undefined) || undefined,
    maxResults: Number(validatedInput?.maxResults || undefined) || undefined,
  }
  let response
  try {
    response = await jiraClient.findAllUser(addParams)
    logger.forBot().info(`Successful - Find All User - Total Users ${response.length}`)
  } catch (error) {
    logger.forBot().debug(`'Find All User' exception ${JSON.stringify(error)}`)
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    throw new RuntimeError(`Failed to find all users: ${message}`)
  }
  return findAllUsersOutputSchema.parse({
    users: response.map((user) => ({
      ...user,
      active: user.active ?? false,
    })),
  })
}

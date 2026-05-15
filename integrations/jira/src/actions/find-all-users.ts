import { findAllUsersInputSchema, findAllUsersOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { buildRuntimeError, getClient, serializeErrorForLog } from '../utils'

export const findAllUsers: Implementation['actions']['findAllUsers'] = async ({ client, ctx, input, logger }) => {
  const validatedInput = findAllUsersInputSchema.parse(input)
  const jiraClient = await getClient({ client, ctx, logger })
  const addParams = {
    startAt: validatedInput.startAt,
    maxResults: validatedInput.maxResults,
  }
  try {
    const response = await jiraClient.findAllUsers(addParams)
    logger.forBot().info(`Successful - Find All User - Total Users ${response.length}`)
    return findAllUsersOutputSchema.parse({
      users: response.map((user) => ({
        ...user,
        active: user.active ?? false,
      })),
    })
  } catch (error) {
    logger.forBot().debug(`'Find All User' exception ${serializeErrorForLog(error)}`)
    throw buildRuntimeError('Failed to find all users', error)
  }
}

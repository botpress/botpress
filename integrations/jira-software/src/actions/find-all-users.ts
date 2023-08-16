import { Version3Models } from 'jira.js'

import {
  findAllUsersInputSchema,
  findAllUsersOutputSchema,
} from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient } from '../utils'

export const findAllUsers: Implementation['actions']['findAllUsers'] = async ({
  ctx,
  input,
  logger,
}) => {
  const validatedInput = findAllUsersInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)
  const addParams = {
    startAt: Number(validatedInput?.startAt || undefined) || undefined,
    maxResults: Number(validatedInput?.maxResults || undefined) || undefined,
  }
  let response
  try {
    response = await jiraClient.findAllUser(addParams)
    logger
      .forBot()
      .info(`Successful - Find All User - Total Users ${response.length}`)
  } catch (error) {
    logger.forBot().debug(`'Find All User' exception ${JSON.stringify(error)}`)
    response = [] as Version3Models.User[]
  }
  return findAllUsersOutputSchema.parse({ users: response })
}

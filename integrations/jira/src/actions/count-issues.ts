import { countIssuesInputSchema, countIssuesOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { buildRuntimeError, getClient, serializeErrorForLog } from '../utils'

export const countIssues: Implementation['actions']['countIssues'] = async ({ ctx, input, logger }) => {
  const validatedInput = countIssuesInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)

  try {
    const count = await jiraClient.countIssues(validatedInput.jql)
    logger.forBot().info(`Successful - Count Issues - ${count} match`)
    return countIssuesOutputSchema.parse({ count })
  } catch (error) {
    logger.forBot().debug(`'Count Issues' exception ${serializeErrorForLog(error)}`)
    throw buildRuntimeError('Failed to count issues', error)
  }
}

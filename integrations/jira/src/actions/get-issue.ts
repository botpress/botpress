import { RuntimeError } from '@botpress/sdk'

import { getIssueInputSchema, getIssueOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { ISSUE_SEARCH_FIELDS, flattenIssue, getClient } from '../utils'

export const getIssue: Implementation['actions']['getIssue'] = async ({ ctx, input, logger }) => {
  const validatedInput = getIssueInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)

  try {
    const response = await jiraClient.getIssue({
      issueIdOrKey: validatedInput.issueKey,
      fields: ISSUE_SEARCH_FIELDS,
    })
    logger.forBot().info(`Successful - Get Issue - ${response.key}`)
    return getIssueOutputSchema.parse(flattenIssue(response, ctx.configuration.host))
  } catch (error) {
    logger.forBot().debug(`'Get Issue' exception ${JSON.stringify(error)}`)
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    throw new RuntimeError(`Failed to get issue ${validatedInput.issueKey}: ${message}`)
  }
}

import { newIssueInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient } from '../utils'

export const newIssue: Implementation['actions']['newIssue'] = async ({
  ctx,
  input,
  logger,
}) => {
  const validatedInput = newIssueInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)
  const issue = {
    fields: {
      summary: validatedInput.summary,
      description: validatedInput.description,
      issuetype: {
        name: validatedInput.issueType,
      },
      project: {
        key: validatedInput.projectKey,
      },
      parent: {
        key: validatedInput.parentKey || undefined,
      },
      assignee: {
        id: validatedInput.assigneeId || undefined,
      },
    },
  }
  let response
  try {
    response = await jiraClient.newIssue(issue)
    logger.forBot().info(`Successful - New Issue - ${response}`)
  } catch (error) {
    logger.forBot().debug(`'New Issue' exception ${JSON.stringify(error)}`)
    response = ''
  }
  return { issueKey: response }
}

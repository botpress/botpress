import { updateIssueInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient } from '../utils'

export const updateIssue: Implementation['actions']['updateIssue'] = async ({
  ctx,
  input,
  logger,
}) => {
  const validatedInput = updateIssueInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)
  const issueUpdate = {
    issueIdOrKey: validatedInput.issueKey,
    fields: {
      summary: validatedInput.summary || undefined,
      description: validatedInput.description || undefined,
      issuetype: {
        name: validatedInput.issueType || undefined,
      },
      project: {
        key: validatedInput.projectKey || undefined,
      },
      parent: {
        key: validatedInput.parentKey || undefined,
      },
      assignee: {
        id: validatedInput.assigneeId || undefined,
      },
    },
  }
  let issueKey = validatedInput.issueKey
  try {
    await jiraClient.updateIssue(issueUpdate)
    logger.forBot().info(`Successful - Update Issue - ${issueKey}`)
  } catch (error) {
    issueKey = ''
    logger.forBot().debug(`'Update Issue' exception ${JSON.stringify(error)}`)
  }
  return { issueKey }
}

import { Version3Parameters } from 'jira.js'
import { newIssueInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import {
  buildIssueRuntimeError,
  getClient,
  resolveIssueTypeIds,
  serializeErrorForLog,
  textToAdfDocument,
} from '../utils'

export const newIssue: Implementation['actions']['newIssue'] = async ({ ctx, input, logger }) => {
  const validatedInput = newIssueInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)

  try {
    const issueTypeIds = await resolveIssueTypeIds(jiraClient, [
      {
        issueType: validatedInput.issueType,
        projectKey: validatedInput.projectKey,
      },
    ])
    const issueTypeId = issueTypeIds.get(`${validatedInput.projectKey}::${validatedInput.issueType}`)!

    const fields: Version3Parameters.CreateIssue['fields'] = {
      summary: validatedInput.summary,
      issuetype: {
        id: issueTypeId,
      },
      project: {
        key: validatedInput.projectKey,
      },
    }

    if (validatedInput.description !== undefined) {
      fields.description = textToAdfDocument(validatedInput.description)
    }
    if (validatedInput.parentKey !== undefined) {
      fields.parent = { key: validatedInput.parentKey }
    }
    if (validatedInput.assigneeId !== undefined) {
      fields.assignee = { accountId: validatedInput.assigneeId }
    }

    const issue: Version3Parameters.CreateIssue = {
      fields,
    }

    const response = await jiraClient.newIssue(issue)
    logger.forBot().info(`Successful - New Issue - ${response}`)
    return { issueKey: response }
  } catch (error) {
    logger.forBot().debug(`'New Issue' exception ${serializeErrorForLog(error)}`)
    throw buildIssueRuntimeError(error, validatedInput.issueType, validatedInput.projectKey, 'create')
  }
}

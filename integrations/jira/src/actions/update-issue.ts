import { RuntimeError } from '@botpress/sdk'
import { Version3Parameters } from 'jira.js'
import { updateIssueInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import {
  buildIssueRuntimeError,
  getClient,
  resolveIssueTypeIds,
  serializeErrorForLog,
  textToAdfDocument,
} from '../utils'

export const updateIssue: Implementation['actions']['updateIssue'] = async ({ ctx, input, logger }) => {
  const validatedInput = updateIssueInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)
  const fields: NonNullable<Version3Parameters.EditIssue['fields']> = {}

  if (validatedInput.summary !== undefined) {
    fields.summary = validatedInput.summary
  }
  if (validatedInput.description !== undefined) {
    fields.description = textToAdfDocument(validatedInput.description)
  }
  if (validatedInput.projectKey !== undefined) {
    fields.project = { key: validatedInput.projectKey }
  }
  if (validatedInput.parentKey !== undefined) {
    fields.parent = { key: validatedInput.parentKey }
  }
  if (validatedInput.assigneeId !== undefined) {
    fields.assignee = { accountId: validatedInput.assigneeId }
  }

  const issueUpdate: Version3Parameters.EditIssue = {
    issueIdOrKey: validatedInput.issueKey,
    fields,
  }
  try {
    if (validatedInput.issueType !== undefined) {
      if (validatedInput.projectKey === undefined) {
        throw new RuntimeError('projectKey is required when updating issueType')
      }

      const issueTypeIds = await resolveIssueTypeIds(jiraClient, [
        {
          issueType: validatedInput.issueType,
          projectKey: validatedInput.projectKey,
        },
      ])
      const issueTypeId = issueTypeIds.get(`${validatedInput.projectKey}::${validatedInput.issueType}`)
      if (issueTypeId) {
        fields.issuetype = { id: issueTypeId }
      }
    }

    await jiraClient.updateIssue(issueUpdate)
    logger.forBot().info(`Successful - Update Issue - ${validatedInput.issueKey}`)
    return { issueKey: validatedInput.issueKey }
  } catch (error) {
    logger.forBot().debug(`'Update Issue' exception ${serializeErrorForLog(error)}`)
    throw buildIssueRuntimeError(error, validatedInput.issueType, validatedInput.projectKey, 'update')
  }
}

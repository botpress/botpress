import { RuntimeError } from '@botpress/sdk'
import type { Version3Models } from 'jira.js'
import { newIssuesInputSchema, newIssuesOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { buildRuntimeError, getClient, resolveIssueTypeIds, serializeErrorForLog, textToAdfDocument } from '../utils'

type IssueInput = Version3Models.IssueUpdateDetails

export const newIssues: Implementation['actions']['newIssues'] = async ({ ctx, input, logger }) => {
  const validatedInput = newIssuesInputSchema.parse(input)
  if (validatedInput.issues.length === 0) {
    throw new RuntimeError('At least one issue must be provided')
  }
  if (validatedInput.issues.length > 50) {
    throw new RuntimeError(`Jira allows up to 50 issues per batch; received ${validatedInput.issues.length}`)
  }
  const jiraClient = getClient(ctx.configuration)

  try {
    const issueTypeIds = await resolveIssueTypeIds(jiraClient, validatedInput.issues)

    const issueUpdates: IssueInput[] = validatedInput.issues.map((i) => {
      const issueTypeId = issueTypeIds.get(`${i.projectKey}::${i.issueType}`)!
      const fields: NonNullable<IssueInput['fields']> = {
        summary: i.summary,
        issuetype: { id: issueTypeId },
        project: { key: i.projectKey },
      }
      if (i.description !== undefined) fields.description = textToAdfDocument(i.description)
      if (i.parentKey !== undefined) fields.parent = { key: i.parentKey }
      if (i.assigneeId !== undefined) fields.assignee = { accountId: i.assigneeId }
      return { fields }
    })

    const response = await jiraClient.newIssues({ issueUpdates })
    const created = (response.issues ?? []).map((c) => ({ issueKey: c.key }))
    const errors = (response.errors ?? []).map((e) => {
      const fieldErrors = (e.elementErrors?.errors ?? {}) as Record<string, string>
      const detail = [
        ...(e.elementErrors?.errorMessages ?? []),
        ...Object.entries(fieldErrors).map(([k, v]) => `${k}: ${v}`),
      ].join('; ')
      return {
        index: e.failedElementNumber,
        message: detail.length > 0 ? detail : `HTTP ${e.status ?? 'unknown'}`,
      }
    })
    logger.forBot().info(`Successful - New Issues - ${created.length} created, ${errors.length} failed`)
    return newIssuesOutputSchema.parse({ created, errors })
  } catch (error) {
    logger.forBot().debug(`'New Issues' exception ${serializeErrorForLog(error)}`)
    throw buildRuntimeError('Failed to create issues', error)
  }
}

import { pickIssueInputSchema, pickIssueOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { buildRuntimeError, getClient, serializeErrorForLog } from '../utils'

export const pickIssue: Implementation['actions']['pickIssue'] = async ({ ctx, input, logger }) => {
  const validatedInput = pickIssueInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)

  try {
    const response = await jiraClient.pickIssue(validatedInput.query, validatedInput.currentJql)
    const matches: Array<{ issueKey: string; summary?: string; section?: string }> = []
    for (const section of response.sections ?? []) {
      for (const issue of section.issues ?? []) {
        if (!issue.key) continue
        matches.push({
          issueKey: issue.key,
          summary: issue.summaryText ?? issue.summary,
          section: section.label,
        })
      }
    }
    logger.forBot().info(`Successful - Pick Issue - ${matches.length} matches for "${validatedInput.query}"`)
    return pickIssueOutputSchema.parse({ matches })
  } catch (error) {
    logger.forBot().debug(`'Pick Issue' exception ${serializeErrorForLog(error)}`)
    throw buildRuntimeError('Failed to pick issue', error)
  }
}

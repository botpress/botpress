import { RuntimeError } from '@botpress/sdk'

import { listIssueTypesInputSchema, listIssueTypesOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient, getErrorMessage, serializeErrorForLog } from '../utils'

export const listIssueTypes: Implementation['actions']['listIssueTypes'] = async ({ ctx, input, logger }) => {
  const validatedInput = listIssueTypesInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)

  try {
    const response = await jiraClient.listIssueTypesForProject(validatedInput.projectKey)
    const items = (response.issueTypes ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      subtask: t.subtask,
      hierarchyLevel: t.hierarchyLevel,
    }))
    logger.forBot().info(`Successful - List Issue Types - ${items.length} for ${validatedInput.projectKey}`)
    return listIssueTypesOutputSchema.parse({ items })
  } catch (error) {
    logger.forBot().debug(`'List Issue Types' exception ${serializeErrorForLog(error)}`)
    const message = getErrorMessage(error)
    throw new RuntimeError(`Failed to list issue types for project ${validatedInput.projectKey}: ${message}`)
  }
}

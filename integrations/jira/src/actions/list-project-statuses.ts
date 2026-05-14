import { RuntimeError } from '@botpress/sdk'
import { listProjectStatusesInputSchema, listProjectStatusesOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { getClient, getErrorMessage, serializeErrorForLog } from '../utils'

export const listProjectStatuses: Implementation['actions']['listProjectStatuses'] = async ({ ctx, input, logger }) => {
  const validatedInput = listProjectStatusesInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)

  try {
    const response = await jiraClient.listProjectStatuses(validatedInput.projectKey)
    const items = response.flatMap((typeWithStatus) =>
      (typeWithStatus.statuses ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.statusCategory?.name,
        issueType: typeWithStatus.name,
      }))
    )
    logger.forBot().info(`Successful - List Project Statuses - ${items.length} for ${validatedInput.projectKey}`)
    return listProjectStatusesOutputSchema.parse({ items })
  } catch (error) {
    logger.forBot().debug(`'List Project Statuses' exception ${serializeErrorForLog(error)}`)
    const message = getErrorMessage(error)
    throw new RuntimeError(`Failed to list statuses for project ${validatedInput.projectKey}: ${message}`)
  }
}

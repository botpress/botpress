import { RuntimeError } from '@botpress/sdk'
import { listProjectStatusesInputSchema, listProjectStatusesOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { getClient, getErrorMessage, serializeErrorForLog } from '../utils'
import { listFlattenedProjectStatuses } from './helper'

export const listProjectStatuses: Implementation['actions']['listProjectStatuses'] = async ({
  client,
  ctx,
  input,
  logger,
}) => {
  const validatedInput = listProjectStatusesInputSchema.parse(input)
  const jiraClient = await getClient({ client, ctx, logger })

  try {
    const items = await listFlattenedProjectStatuses(jiraClient, validatedInput.projectKey)
    logger.forBot().info(`Successful - List Project Statuses - ${items.length} for ${validatedInput.projectKey}`)
    return listProjectStatusesOutputSchema.parse({ items })
  } catch (error) {
    logger.forBot().debug(`'List Project Statuses' exception ${serializeErrorForLog(error)}`)
    const message = getErrorMessage(error)
    throw new RuntimeError(`Failed to list statuses for project ${validatedInput.projectKey}: ${message}`)
  }
}

import { RuntimeError } from '@botpress/sdk'
import { getWorkflowStatesInputSchema, getWorkflowStatesOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { getClient, getErrorMessage, serializeErrorForLog } from '../utils'
import { listFlattenedProjectStatuses } from './helper'

export const getWorkflowStates: Implementation['actions']['getWorkflowStates'] = async ({
  client,
  ctx,
  input,
  logger,
}) => {
  const validatedInput = getWorkflowStatesInputSchema.parse(input)
  const jiraClient = await getClient({ client, ctx, logger })

  try {
    const items = await listFlattenedProjectStatuses(jiraClient, validatedInput.projectKey)
    logger.forBot().info(`Successful - Get Workflow States - ${items.length} for ${validatedInput.projectKey}`)
    return getWorkflowStatesOutputSchema.parse({ items })
  } catch (error) {
    logger.forBot().debug(`'Get Workflow States' exception ${serializeErrorForLog(error)}`)
    const message = getErrorMessage(error)
    throw new RuntimeError(`Failed to get workflow states for project ${validatedInput.projectKey}: ${message}`)
  }
}

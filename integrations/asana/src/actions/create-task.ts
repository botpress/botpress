import { createTaskInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

import { getClient } from '../utils'

export const createTask: IntegrationProps['actions']['createTask'] = async ({ ctx, input, logger }) => {
  const validatedInput = createTaskInputSchema.parse(input)
  const asanaClient = getClient(ctx.configuration)
  const task = {
    workspace: ctx.configuration.workspaceGid,
    name: validatedInput.name,
    notes: validatedInput.notes || undefined,
    assignee: validatedInput.assignee || undefined,
    projects: validatedInput.projects?.split(',').map((project) => project.trim()) || undefined,
    parent: validatedInput.parent || undefined,
    due_on: validatedInput.due_on || validatedInput.start_on || undefined,
    start_on: validatedInput.start_on || undefined,
  }
  let response
  try {
    response = await asanaClient.createTask(task)
    logger.forBot().info(`Successful - Create Task - ${response.permalink_url}`)
  } catch (error) {
    logger.forBot().debug(`'Create Task' exception ${JSON.stringify(error)}`)
    response = {}
  }
  return { permalink_url: response.permalink_url || '' }
}

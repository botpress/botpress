import { updateTaskInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

import { getClient } from '../utils'

export const updateTask: IntegrationProps['actions']['updateTask'] = async ({ ctx, input, logger }) => {
  const validatedInput = updateTaskInputSchema.parse(input)
  const asanaClient = getClient(ctx.configuration)
  const task = {
    name: validatedInput.name,
    notes: validatedInput.notes || undefined,
    assignee: validatedInput.assignee || undefined,
    due_on: validatedInput.due_on || validatedInput.start_on || undefined,
    start_on: validatedInput.start_on || undefined,
    completed: validatedInput.completed === 'true' ? true : undefined,
  }
  let response
  try {
    response = await asanaClient.updateTask(validatedInput.taskId, task)
    logger.forBot().info(`Successful - Update Task - ${response.permalink_url}`)
  } catch (error) {
    logger.forBot().debug(`'Update Task' exception ${JSON.stringify(error)}`)
    response = {}
  }
  return { permalink_url: response.permalink_url || '' }
}

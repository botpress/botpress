import { addCommentToTaskInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

import { getClient } from '../utils'

export const addCommentToTask: IntegrationProps['actions']['addCommentToTask'] = async ({ ctx, input, logger }) => {
  const validatedInput = addCommentToTaskInputSchema.parse(input)
  const asanaClient = getClient(ctx.configuration)
  let response
  try {
    response = await asanaClient.addCommentToTask(validatedInput.taskId, validatedInput.comment)
    logger.forBot().info(`Successful - Add Comment to Task - ${response.text}`)
  } catch (error) {
    logger.forBot().debug(`'Add Comment to Task' exception ${JSON.stringify(error)}`)
    response = {}
  }
  return { text: response.text || '' }
}

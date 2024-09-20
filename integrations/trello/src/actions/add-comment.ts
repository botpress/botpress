import { addCommentInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

import { getClient } from '../utils'

export const addComment: IntegrationProps['actions']['addComment'] = async ({ ctx, input, logger }) => {
  const validatedInput = addCommentInputSchema.parse(input)

  const trelloClient = getClient(ctx.configuration)

  const comment = {
    id: validatedInput.cardId || '',
    text: validatedInput.comment || '',
  }
  let response

  try {
    response = await trelloClient.addCommentToCard(comment)
    logger.forBot().info(`Successful - Add Comment - ${response.data?.text}`)
  } catch (error) {
    logger.forBot().debug(`'Add Comment' exception ${JSON.stringify(error)}`)
    response = {}
  }

  return { text: response.data?.text || '' }
}

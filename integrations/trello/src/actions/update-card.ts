import { updateCardInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

import { getClient } from '../utils'

export const updateCard: IntegrationProps['actions']['updateCard'] = async ({ ctx, input, logger }) => {
  const validatedInput = updateCardInputSchema.parse(input)

  const trelloClient = getClient(ctx.configuration)

  const card = {
    id: validatedInput.cardId,
    name: validatedInput.name || undefined,
    idList: validatedInput.listId || undefined,
    desc: validatedInput.desc || undefined,
    due: validatedInput.due || undefined,
    idMembers: validatedInput.idMembers?.split(',').map((member) => member.trim()) || undefined,
    idLabels: validatedInput.idLabels?.split(',').map((label) => label.trim()) || undefined,
    closed: validatedInput.closed === 'true' ? true : validatedInput.closed === 'false' ? false : undefined,
    dueComplete:
      validatedInput.dueComplete === 'true' ? true : validatedInput.dueComplete === 'false' ? false : undefined,
  }

  let response

  try {
    response = await trelloClient.updateCard(card)
    logger.forBot().info(`Successful - Update Task - ${response.url}`)
  } catch (error) {
    logger.forBot().debug(`'Update Card' exception ${JSON.stringify(error)}`)
    response = {}
  }

  return { id: validatedInput.cardId, url: response.url || '' }
}

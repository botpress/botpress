import { createCardInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

import { getClient } from '../utils'

export const createCard: IntegrationProps['actions']['createCard'] = async ({ ctx, input, logger }) => {
  const validatedInput = createCardInputSchema.parse(input)

  const trelloClient = getClient(ctx.configuration)

  const card = {
    name: validatedInput.name,
    idList: validatedInput.listId,
    desc: validatedInput.desc || undefined,
    due: validatedInput.due || undefined,
    idMembers: validatedInput.idMembers?.split(',').map((member) => member.trim()) || undefined,
    idLabels: validatedInput.idLabels?.split(',').map((label) => label.trim()) || undefined,
  }

  let response

  try {
    response = await trelloClient.createCard(card)
    logger.forBot().info(`Successful - Create Task - ${response.url}`)
  } catch (error) {
    logger.forBot().debug(`'Create Card' exception ${JSON.stringify(error)}`)
    response = {}
  }

  return { id: response.id || '', url: response.url || '' }
}

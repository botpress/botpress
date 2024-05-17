import { getMemberInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

import { getClient } from '../utils'

export const getMember: IntegrationProps['actions']['getMember'] = async ({ ctx, input, logger }) => {
  const validatedInput = getMemberInputSchema.parse(input)

  const trelloClient = getClient(ctx.configuration)

  let response

  try {
    response = await trelloClient.getMember(validatedInput.usernameOrId)
    logger.forBot().info(`Successful - Get Member - ${response.fullName}`)
  } catch (error) {
    logger.forBot().debug(`'Get Member' exception ${error}`)
    response = {}
  }

  return response
}

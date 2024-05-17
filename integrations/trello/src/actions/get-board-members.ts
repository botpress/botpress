import { Models } from 'trello.js'

import { getBoardMembersInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

import { getClient } from '../utils'

export const getBoardMembers: IntegrationProps['actions']['getBoardMembers'] = async ({ ctx, input, logger }) => {
  const validatedInput = getBoardMembersInputSchema.parse(input)

  const trelloClient = getClient(ctx.configuration)

  let response

  try {
    response = await trelloClient.getBoardMembers(validatedInput.boardId)
    logger.forBot().info(`Successful - Get Board Members - Total Members ${response.length}`)
  } catch (error) {
    logger.forBot().debug(`'Get Board Members' exception ${error}`)
    response = [] as Models.Member[]
  }

  return {
    members: response,
  }
}

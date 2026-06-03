import { getAuthenticatedHubspotClient } from '../utils'
import * as bp from '.botpress'

export const getOwner: bp.IntegrationProps['actions']['getOwner'] = async ({ ctx, client, input, logger }) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client, logger })
  try {
    const owner = await hsClient.getOwnerById({ ownerId: input.ownerId })
    return {
      owner: {
        id: owner.id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
        userId: owner.userId,
        type: owner.type,
        archived: owner.archived,
        createdAt: owner.createdAt.toISOString(),
        updatedAt: owner.updatedAt.toISOString(),
      },
    }
  } catch (err: unknown) {
    logger.forBot().debug(`Owner ${input.ownerId} could not be retrieved: ${err}`)
    return { owner: undefined }
  }
}

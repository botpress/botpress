import { HubSpotHitlClient } from '../client'
import { getConversationByExternalIdOrThrow } from '../utils/conversation'
import * as bp from '.botpress'

type HubSpotEvent = {
  objectId: string | number
  subscriptionType: string
  propertyName?: string
  propertyValue?: string
}

type OperatorAssignedParams = {
  hubspotEvent: HubSpotEvent
  client: bp.Client
  hubSpotClient: HubSpotHitlClient
  logger: bp.Logger
}

export const handleOperatorAssignedUpdate = async ({
  hubspotEvent,
  client,
  hubSpotClient,
  logger,
}: OperatorAssignedParams) => {
  try {
    const actorId = hubspotEvent.propertyValue

    if (!actorId) {
      logger.forBot().warn('assignedTo event has no actor — skipping')
      return
    }

    const conversation = await getConversationByExternalIdOrThrow(client, hubspotEvent.objectId)

    const { user } = await client.getOrCreateUser({
      tags: { actorId },
      discriminateByTags: ['actorId'],
    })

    const details = await hubSpotClient.getActorDetails(actorId).catch(() => null)
    if (details) {
      await client.updateUser({
        id: user.id,
        name: details.name,
        pictureUrl: details.avatar,
        tags: { actorId, email: details.email },
      })
    }

    await client.createEvent({
      type: 'hitlAssigned',
      payload: {
        conversationId: conversation.id,
        userId: user.id,
      },
    })

    logger.forBot().info(`hitlAssigned fired: conversation=${conversation.id}, user=${user.id}`)
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().error(`Failed to handle "operator assignment" event: ${error.message}`)
  }
}

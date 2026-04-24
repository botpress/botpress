import { getConversationByExternalIdOrThrow } from '../utils/conversation'
import * as bp from '.botpress'

type HubSpotEvent = {
  objectId: string | number
  subscriptionType: string
  propertyName?: string
  propertyValue?: string
}

type ConversationCompletedParams = {
  hubspotEvent: HubSpotEvent
  client: bp.Client
  logger: bp.Logger
}

export const handleConversationCompleted = async ({ hubspotEvent, client, logger }: ConversationCompletedParams) => {
  try {
    const conversation = await getConversationByExternalIdOrThrow(client, hubspotEvent.objectId)

    await client.createEvent({
      type: 'hitlStopped',
      payload: { conversationId: conversation.id },
    })
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().error(`Failed to handle "conversation completed" event: ${error.message}`)
  }
}

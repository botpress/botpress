import * as bp from '.botpress'

interface HubSpotEvent {
  objectId: string | number
  subscriptionType: string
  propertyName?: string
  propertyValue?: string
}

interface ConversationCompletedParams {
  hubspotEvent: HubSpotEvent
  client: bp.Client
}

export const handleConversationCompleted = async ({ hubspotEvent, client }: ConversationCompletedParams) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: { id: String(hubspotEvent.objectId) },
  })

  await client.createEvent({
    type: 'hitlStopped',
    payload: { conversationId: conversation.id },
  })
}

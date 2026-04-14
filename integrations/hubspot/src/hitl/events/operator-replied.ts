import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'

interface HubSpotMessage {
  conversationsThreadId: string
  text: string
  senders?: Array<{ actorId: string }>
}

interface HubSpotEvent {
  type: string
  message?: HubSpotMessage
}

interface OperatorRepliedParams {
  hubspotEvent: HubSpotEvent
  client: bp.Client
}

export const handleOperatorReplied = async ({ hubspotEvent, client }: OperatorRepliedParams) => {
  if (!hubspotEvent.message?.conversationsThreadId) {
    throw new Error('Missing conversation thread ID in operator message')
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: { id: hubspotEvent.message.conversationsThreadId },
  })

  const actorId = hubspotEvent.message?.senders?.[0]?.actorId

  if (!actorId) {
    throw new RuntimeError('Missing actorId in operator message senders')
  }

  const { user } = await client.getOrCreateUser({
    tags: { actorId },
    discriminateByTags: ['actorId'],
  })

  if (!user?.id) {
    throw new Error('Failed to get or create agent user')
  }

  await client.createMessage({
    tags: {},
    type: 'text',
    userId: user.id,
    conversationId: conversation.id,
    payload: { text: hubspotEvent.message.text },
  })
}

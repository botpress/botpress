import { RuntimeError } from '@botpress/sdk'
import { getConversationByExternalIdOrThrow } from '../utils/conversation'
import * as bp from '.botpress'

type HubSpotMessage = {
  conversationsThreadId: string
  text: string
  senders?: Array<{ actorId: string }>
}

type HubSpotEvent = {
  type: string
  message?: HubSpotMessage
}

type OperatorRepliedParams = {
  hubspotEvent: HubSpotEvent
  client: bp.Client
}

export const handleOperatorReplied = async ({ hubspotEvent, client }: OperatorRepliedParams) => {
  if (!hubspotEvent.message?.conversationsThreadId) {
    throw new RuntimeError('Missing conversation thread ID in operator message')
  }

  const conversation = await getConversationByExternalIdOrThrow(client, hubspotEvent.message.conversationsThreadId)

  const actorId = hubspotEvent.message?.senders?.[0]?.actorId

  if (!actorId) {
    throw new RuntimeError('Missing actorId in operator message senders')
  }

  const { user } = await client.getOrCreateUser({
    tags: { actorId },
    discriminateByTags: ['actorId'],
  })

  if (!user?.id) {
    throw new RuntimeError('Failed to get or create agent user')
  }

  await client.createMessage({
    tags: {},
    type: 'text',
    userId: user.id,
    conversationId: conversation.id,
    payload: { text: hubspotEvent.message.text },
  })
}

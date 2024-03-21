import { Conversation } from '@botpress/client'
import type { ChatEstablishedMessage } from 'src/triggers'
import * as bp from '.botpress'

export const executeConversationAssigned = async ({
  conversation,
  message,
  client,
}: {
  conversation: Conversation
  message: ChatEstablishedMessage
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onConversationAssigned',
    payload: {
      conversation,
      agentName: message.name
    },
  })
}

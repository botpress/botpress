import { Conversation } from '@botpress/client'
import type { ChatEstablishedMessage } from 'src/triggers'
import * as bp from '.botpress'

export const executeConversationAssigned = async ({
  botpressConversationId,
  message,
  client,
}: {
  botpressConversationId: string
  message: ChatEstablishedMessage
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onConversationAssigned',
    payload: {
      botpressConversationId,
      agentName: message.name
    },
  })
}

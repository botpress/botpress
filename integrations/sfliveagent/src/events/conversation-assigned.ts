import type { ChatEstablishedMessage } from 'src/triggers'
import * as bp from '.botpress'

export const executeConversationAssigned = async ({
  botpressConversationId,
  botpressUserId,
  message,
  client,
}: {
  botpressConversationId: string
  botpressUserId: string
  message: ChatEstablishedMessage
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onConversationAssigned',
    payload: {
      botpressConversationId,
      botpressUserId,
      agentName: message.name
    },
  })
}

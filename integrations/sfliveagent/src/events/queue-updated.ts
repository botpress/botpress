import { QueueUpdateMessage } from 'src/triggers'
import * as bp from '.botpress'

export const executeQueueUpdated = async ({
  botpressConversationId,
  botpressUserId,
  message,
  client,
}: {
  botpressConversationId: string
  botpressUserId: string
  message: QueueUpdateMessage
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onQueueUpdated',
    payload: {
      botpressConversationId,
      botpressUserId,
      estimatedWaitTime: message.estimatedWaitTime,
      position: message.position
    },
  })
}

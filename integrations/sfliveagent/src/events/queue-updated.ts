import { Conversation } from '@botpress/client'
import { QueueUpdateMessage } from 'src/triggers'
import * as bp from '.botpress'

export const executeQueueUpdated = async ({
  botpressConversationId,
  message,
  client,
}: {
  botpressConversationId: string
  message: QueueUpdateMessage
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onQueueUpdated',
    payload: {
      botpressConversationId,
      estimatedWaitTime: message.estimatedWaitTime,
      position: message.position
    },
  })
}

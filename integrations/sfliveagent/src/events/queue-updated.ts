import { Conversation } from '@botpress/client'
import { QueueUpdateMessage } from 'src/triggers'
import * as bp from '.botpress'

export const executeQueueUpdated = async ({
  conversation,
  message,
  client,
}: {
  conversation: Conversation
  message: QueueUpdateMessage
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onQueueUpdated',
    payload: {
      conversation,
      estimatedWaitTime: message.estimatedWaitTime,
      position: message.position
    },
  })
}

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
  console.log('Executing Trigger onQueueUpdated for conversation of Botpress: ' + JSON.stringify({
    botpressConversationId,
    botpressUserId,
    estimatedWaitTime: message.estimatedWaitTime,
    position: message.position
  }, null, 2)
  )

  await client.createEvent({
    type: 'onQueueUpdated',
    conversationId: botpressConversationId,
    payload: {
      botpressConversationId,
      botpressUserId,
      estimatedWaitTime: message.estimatedWaitTime,
      position: message.position
    },
  })
}

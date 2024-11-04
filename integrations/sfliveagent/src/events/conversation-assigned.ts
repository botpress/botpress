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

  console.log('Executing Trigger onConversationAssigned for conversation of Botpress: ' + JSON.stringify({
      botpressConversationId,
      botpressUserId,
      agentName: message.name
    }, null, 2)
  )

  await client.createEvent({
    type: 'onConversationAssigned',
    conversationId: botpressConversationId,
    userId: botpressUserId,
    payload: {
      botpressConversationId,
      botpressUserId,
      agentName: message.name
    },
  })
}

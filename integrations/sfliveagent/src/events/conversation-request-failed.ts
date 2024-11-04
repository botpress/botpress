import { ChatRequestFailMessage } from 'src/triggers'
import * as bp from '.botpress'

export const executeConversationRequestFailed = async ({
  botpressConversationId,
  botpressUserId,
  message,
  client,
}: {
  botpressConversationId: string
  botpressUserId: string
  message: ChatRequestFailMessage
  client: bp.Client
}) => {

  console.log('Executing Trigger onConversationRequestFailed for conversation of Botpress: ' + JSON.stringify({
    botpressConversationId,
    botpressUserId,
    reason: message.reason
  }, null, 2)
  )

  await client.createEvent({
    type: 'onConversationRequestFailed',
    conversationId: botpressConversationId,
    payload: {
      botpressConversationId,
      botpressUserId,
      reason: message.reason
    },
  })
}

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
  await client.createEvent({
    type: 'onConversationRequestFailed',
    payload: {
      botpressConversationId,
      botpressUserId,
      reason: message.reason
    },
  })
}

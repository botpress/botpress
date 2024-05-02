import { Conversation } from '@botpress/client'
import { ChatRequestFailMessage } from 'src/triggers'
import * as bp from '.botpress'

export const executeConversationRequestFailed = async ({
  botpressConversationId,
  message,
  client,
}: {
  botpressConversationId: string
  message: ChatRequestFailMessage
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onConversationRequestFailed',
    payload: {
      botpressConversationId,
      reason: message.reason
    },
  })
}

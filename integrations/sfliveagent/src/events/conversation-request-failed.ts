import { Conversation } from '@botpress/client'
import { ChatRequestFailMessage } from 'src/triggers'
import * as bp from '.botpress'

export const executeConversationRequestFailed = async ({
  conversation,
  message,
  client,
}: {
  conversation: Conversation
  message: ChatRequestFailMessage
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onConversationRequestFailed',
    payload: {
      conversation,
      reason: message.reason
    },
  })
}

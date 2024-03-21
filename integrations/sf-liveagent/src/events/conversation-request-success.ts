import { Conversation } from '@botpress/client'
import * as bp from '.botpress'

export const executeConversationRequestSuccess = async ({
  conversation,
  client,
}: {
  conversation: Conversation
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onConversationRequestSuccess',
    payload: {
      conversation
    },
  })
}

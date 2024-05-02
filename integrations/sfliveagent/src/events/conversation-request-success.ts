import { Conversation } from '@botpress/client'
import * as bp from '.botpress'

export const executeConversationRequestSuccess = async ({
  botpressConversationId,
  client,
}: {
  botpressConversationId: string
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onConversationRequestSuccess',
    payload: {
      botpressConversationId
    },
  })
}

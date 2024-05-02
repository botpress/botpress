import { Conversation } from '@botpress/client'
import * as bp from '.botpress'

export const executeAgentNotTyping = async ({
  botpressConversationId,
  client,
}: {
  botpressConversationId: string
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onAgentNotTyping',
    payload: {
      botpressConversationId
    },
  })
}

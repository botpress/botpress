import { ChatTransferredMessage } from 'src/triggers'
import * as bp from '.botpress'

export const executeConversationTransferred = async ({
  botpressConversationId,
  botpressUserId,
  message,
  client,
}: {
  botpressConversationId: string
  botpressUserId: string
  message: ChatTransferredMessage
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onConversationTransferred',
    payload: {
      botpressConversationId,
      botpressUserId,
      agentName: message.name
    },
  })
}

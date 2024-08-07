import { ChatTransferredMessage } from 'src/triggers'
import * as bp from '.botpress'

export const executeConversationTransferred = async ({
  botpressConversationId,
  message,
  client,
}: {
  botpressConversationId: string
  message: ChatTransferredMessage
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onConversationTransferred',
    payload: {
      botpressConversationId,
      agentName: message.name
    },
  })
}

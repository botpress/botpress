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

  console.log('Executing Trigger onConversationTransferred for conversation of Botpress: ' + JSON.stringify({
    botpressConversationId,
    botpressUserId,
    agentName: message.name
  }, null, 2)
  )

  await client.createEvent({
    type: 'onConversationTransferred',
    conversationId: botpressConversationId,
    payload: {
      botpressConversationId,
      botpressUserId,
      agentName: message.name
    },
  })
}

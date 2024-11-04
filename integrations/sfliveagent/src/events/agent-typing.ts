import * as bp from '.botpress'

export const executeAgentTyping = async ({
  botpressConversationId,
  botpressUserId,
  client,
}: {
  botpressConversationId: string
  botpressUserId: string
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onAgentTyping',
    conversationId: botpressConversationId,
    payload: {
      botpressConversationId,
      botpressUserId
    },
  })
}

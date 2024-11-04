import * as bp from '.botpress'

export const executeAgentNotTyping = async ({
  botpressConversationId,
  botpressUserId,
  client,
}: {
  botpressConversationId: string
  botpressUserId: string
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onAgentNotTyping',
    conversationId: botpressConversationId,
    payload: {
      botpressConversationId,
      botpressUserId
    },
  })
}

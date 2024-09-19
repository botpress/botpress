import * as bp from '.botpress'

export const executeAgentMessage = async ({
  botpressConversationId,
  botpressUserId,
  client,
  message
}: {
  botpressConversationId: string
  botpressUserId: string
  message: { text: string; name: string }
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onAgentMessage',
    payload: {
      botpressConversationId,
      botpressUserId,
      message
    },
  })
}

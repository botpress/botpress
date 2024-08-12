import * as bp from '.botpress'

export const executeAgentMessage = async ({
  botpressConversationId,
  client,
  message
}: {
  botpressConversationId: string
  message: { text: string; name: string }
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onAgentMessage',
    payload: {
      botpressConversationId,
      message
    },
  })
}

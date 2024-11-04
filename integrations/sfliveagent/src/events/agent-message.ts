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

  console.log('Executing Trigger executeAgentMessage for conversation of Botpress: ' + JSON.stringify({
    botpressConversationId,
    botpressUserId,
    message
  }, null, 2)
  )

  await client.createEvent({
    type: 'onAgentMessage',
    payload: {
      botpressConversationId,
      botpressUserId,
      message
    },
  })
}

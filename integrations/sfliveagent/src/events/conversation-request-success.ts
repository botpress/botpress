import * as bp from '.botpress'

export const executeConversationRequestSuccess = async ({
  botpressConversationId,
  botpressUserId,
  client,
}: {
  botpressConversationId: string
  botpressUserId: string
  client: bp.Client
}) => {

  console.log('Executing Trigger onConversationRequestSuccess for conversation of Botpress: ' + JSON.stringify({
    botpressConversationId,
    botpressUserId
  }, null, 2)
  )

  await client.createEvent({
    type: 'onConversationRequestSuccess',
    conversationId: botpressConversationId,
    payload: {
      botpressConversationId,
      botpressUserId
    },
  })
}

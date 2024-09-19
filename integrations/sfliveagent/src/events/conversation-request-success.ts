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
  await client.createEvent({
    type: 'onConversationRequestSuccess',
    payload: {
      botpressConversationId,
      botpressUserId
    },
  })
}

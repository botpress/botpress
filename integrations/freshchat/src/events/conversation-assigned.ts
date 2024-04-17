import * as bp from '.botpress'

export const executeConversationAssigned = async ({
  client,
  conversation,
  user,
  agent_name,
}: {
  client: bp.Client
  conversation: { id: string }
  user: { id: string }
  agent_name: string
}) => {
  await client.createEvent({
    type: 'onConversationAssigned',
    payload: {
      conversation,
      agent_name
    },
    conversationId: conversation.id,
    userId: user.id
  })
}

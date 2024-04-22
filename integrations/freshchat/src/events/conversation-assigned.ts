import * as bp from '.botpress'
import * as console from 'node:console'

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
  console.log('Will create events with parameters: ', { client, conversation, user, agent_name })

  return await client.createEvent({
    type: 'onConversationAssigned',
    payload: {
      conversation,
      agent_name
    },
    conversationId: conversation.id,
    userId: user.id
  })
}

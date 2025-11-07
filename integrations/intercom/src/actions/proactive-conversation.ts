import { RuntimeError } from '@botpress/sdk'
import { getAuthenticatedIntercomClient } from '../auth'
import * as bp from '.botpress'

export const getOrCreateConversation: bp.IntegrationProps['actions']['getOrCreateConversation'] = async (props) => {
  const { client, ctx, input } = props
  const { id: conversationId } = input.conversation
  if (!conversationId) {
    throw new RuntimeError('Conversation ID is required')
  }

  const intercomClient = await getAuthenticatedIntercomClient(client, ctx)
  const chat = await intercomClient.conversations.find({ id: conversationId })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { id: chat.id },
  })

  return { conversationId: conversation.id }
}

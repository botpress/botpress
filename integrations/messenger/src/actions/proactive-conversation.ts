import { RuntimeError } from '@botpress/sdk'
import { getMessengerClient } from '../misc/utils'
import * as bp from '.botpress'

const getOrCreateConversation: bp.IntegrationProps['actions']['getOrCreateConversation'] = async ({
  client,
  ctx,
  input,
}) => {
  const userId = input.conversation.id
  if (!userId) {
    throw new RuntimeError('User ID is required')
  }

  const messengerClient = await getMessengerClient(client, ctx)
  const profile = await messengerClient.getUserProfile(userId)

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { id: profile.id },
  })

  return {
    conversationId: conversation.id,
  }
}

export default getOrCreateConversation

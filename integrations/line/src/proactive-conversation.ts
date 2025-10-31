import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

const getOrCreateConversation: bp.IntegrationProps['actions']['getOrCreateConversation'] = async ({
  client,
  input,
}) => {
  const userId = input.conversation.id
  if (!userId) {
    throw new RuntimeError('User ID is required')
  }
  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { usrId: userId },
  })

  return {
    conversationId: conversation.id,
  }
}

export default getOrCreateConversation

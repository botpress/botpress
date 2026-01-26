import { RuntimeError } from '@botpress/client'
import * as bp from '.botpress'

export const getOrCreateConversation: bp.IntegrationProps['actions']['getOrCreateConversation'] = async (props) => {
  const { client, input } = props
  const { id: slackConversationId } = input.conversation

  if (!slackConversationId) {
    throw new RuntimeError('Conversation ID is required')
  }

  const channel = slackConversationId.startsWith('D') ? 'dm' : 'channel'

  const { conversation } = await client.getOrCreateConversation({
    channel,
    tags: { id: slackConversationId },
  })

  return {
    conversationId: conversation.id,
  }
}

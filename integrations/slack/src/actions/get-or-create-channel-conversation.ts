import { RuntimeError } from '@botpress/client'
import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const getOrCreateChannelConversation = wrapActionAndInjectSlackClient(
  { actionName: 'getOrCreateChannelConversation', errorMessage: 'Failed to get or create channel conversation' },
  async ({ client }, { channelId }) => {
    if (!channelId) {
      throw new RuntimeError('channelId must be provided')
    }

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: { id: channelId },
    })

    return { conversationId: conversation.id }
  }
)

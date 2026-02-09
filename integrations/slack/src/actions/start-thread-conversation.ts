import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const startThreadConversation = wrapActionAndInjectSlackClient(
  { actionName: 'startThreadConversation', errorMessage: 'Failed to start Thread conversation' },
  async ({ client }, { channelId, threadTs }) => {
    const { conversation: newConversation } = await client.getOrCreateConversation({
      channel: 'thread',
      tags: {
        id: channelId,
        thread: threadTs,
        mentionsBot: 'true',
        isBotReplyThread: 'true',
      },
    })

    return {
      conversationId: newConversation.id,
    }
  }
)

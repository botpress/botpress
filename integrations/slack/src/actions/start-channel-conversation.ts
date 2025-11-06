import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const startChannelConversation = wrapActionAndInjectSlackClient(
  { actionName: 'startChannelConversation', errorMessage: 'Failed to start Channel conversation' },
  async ({ client, slackClient }, { channelId }) => {
    const channelName = slackClient.


    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        title: 'a',
        id: channelId,
      },
      discriminateByTags: ['id'],
    })

    await client.updateUser({
      id: user.id,
      tags: {
        dm_conversation_id: conversation.id,
        id: slackUserId,
      },
    })

    return {
      conversationId: conversation.id,
      userId: user.id,
    }
  }
)

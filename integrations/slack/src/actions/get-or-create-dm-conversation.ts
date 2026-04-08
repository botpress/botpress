import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const getOrCreateDmConversation = wrapActionAndInjectSlackClient(
  { actionName: 'getOrCreateDmConversation', errorMessage: 'Failed to get or create DM conversation' },
  async ({ client, slackClient }, { slackUserId }) => {
    const { user } = await client.getOrCreateUser({
      tags: {
        id: slackUserId,
      },
    })

    if (user.tags.dm_conversation_id) {
      return {
        conversationId: user.tags.dm_conversation_id,
        userId: user.id,
      }
    }

    const channelId = await slackClient.startDmWithUser(slackUserId)

    const { conversation } = await client.getOrCreateConversation({
      channel: 'dm',
      tags: {
        id: channelId,
        title: `DM with ${user.name}`,
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

import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const startDmConversation = wrapActionAndInjectSlackClient(
  { actionName: 'startDmConversation', errorMessage: 'Failed to start DM conversation' },
  async ({ client, slackClient }, { slackUserId }) => {
    const { user } = await client.getOrCreateUser({
      tags: {
        id: slackUserId,
      },
    })

    let conversationId: string | undefined

    if (user.tags.dm_conversation_id) {
      try {
        await client.getConversation({ id: user.tags.dm_conversation_id })
        conversationId = user.tags.dm_conversation_id
      } catch {
        // NOTE: Cached conversation no longer exists (e.g. bot was re-deployed), fall through to create a new one
      }
    }

    if (!conversationId) {
      const channelId = await slackClient.startDmWithUser(slackUserId)

      const { conversation } = await client.getOrCreateConversation({
        channel: 'dm',
        tags: {
          id: channelId,
          title: `DM with ${user.name}`,
        },
        discriminateByTags: ['id'],
      })

      conversationId = conversation.id

      await client.updateUser({
        id: user.id,
        tags: {
          dm_conversation_id: conversation.id,
          id: slackUserId,
        },
      })
    }

    return {
      conversationId,
      userId: user.id,
    }
  }
)

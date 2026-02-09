import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const startDmConversation = wrapActionAndInjectSlackClient(
  { actionName: 'startDmConversation', errorMessage: 'Failed to start DM conversation' },
  async ({ client, ctx, slackClient, logger }, { slackUserId, message }) => {
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

    if (message) {
      const { conversation } = await client.getConversation({ id: conversationId })
      const channelId = conversation.tags.id

      if (!channelId) {
        logger.forBot().error(`Cannot send initial DM: missing Slack channel ID on conversation ${conversationId}`)
      } else {
        logger.forBot().debug(`Sending initial DM to ${slackUserId} in channel ${channelId}`)
        await slackClient.postMessage({ channelId, text: message })

        await client
          .createMessage({
            origin: 'synthetic',
            conversationId,
            userId: ctx.botId,
            type: 'text',
            payload: { text: message },
            tags: {},
          })
          .catch((err: unknown) => {
            const error = err instanceof Error ? err : new Error(String(err))
            logger.forBot().error(`Failed to create synthetic message for initial DM: ${error.message}`)
          })
      }
    }

    return {
      conversationId,
      userId: user.id,
    }
  }
)

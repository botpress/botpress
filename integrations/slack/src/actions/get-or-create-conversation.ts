import { RuntimeError } from '@botpress/client'
import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const getOrCreateConversation = wrapActionAndInjectSlackClient(
  { actionName: 'getOrCreateConversation', errorMessage: 'Failed to get or create conversation' },
  async ({ client, logger, slackClient }, { conversation: input }) => {
    if (input.channel === 'channel') {
      let resolvedChannelId: string | undefined = input.channelId

      if (!resolvedChannelId) {
        if (!input.channelName) {
          throw new RuntimeError('Either channelId or channelName must be provided for channel conversations')
        }

        const slackChannelInfo = await slackClient.getChannelInfo({ channelName: input.channelName })
        if (slackChannelInfo === undefined) {
          const errorMessage = `The channel "${input.channelName}" does not exist or your bot does not have access to it`
          logger.forBot().error(errorMessage)
          throw new RuntimeError(errorMessage)
        }

        resolvedChannelId = slackChannelInfo.id
      }

      const { conversation } = await client.getOrCreateConversation({
        channel: 'channel',
        tags: { id: resolvedChannelId },
      })

      return { conversationId: conversation.id }
    }

    if (!input.slackUserId) {
      throw new RuntimeError('slackUserId must be provided for DM conversations')
    }

    const { user } = await client.getOrCreateUser({
      tags: { id: input.slackUserId },
    })

    if (user.tags.dm_conversation_id) {
      return { conversationId: user.tags.dm_conversation_id }
    }

    const channelId = await slackClient.startDmWithUser(input.slackUserId)

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
        id: input.slackUserId,
      },
    })

    return { conversationId: conversation.id }
  }
)

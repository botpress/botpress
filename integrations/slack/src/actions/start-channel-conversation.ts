import { RuntimeError } from '@botpress/client'
import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const startChannelConversation = wrapActionAndInjectSlackClient(
  { actionName: 'startChannelConversation', errorMessage: 'Failed to start Channel conversation' },
  async ({ client, logger, slackClient }, { channelName, channelId }) => {
    if (!channelName && !channelId) {
      const errorMessage = 'Either channelName or channelId must be provided'
      logger.forBot().error(errorMessage)
      throw new RuntimeError(errorMessage)
    }

    let channelIdToUse: string

    if (channelId) {
      channelIdToUse = channelId
    } else {
      const slackChannelInfo = await slackClient.getChannelInfo({ channelName })
      if (slackChannelInfo === undefined || !slackChannelInfo.id) {
        const errorMessage = `The channel "${channelName}" does not exist or your bot does not have access to it`
        logger.forBot().error(errorMessage)
        throw new RuntimeError(errorMessage)
      }
      channelIdToUse = slackChannelInfo.id
    }

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: { id: channelIdToUse },
    })

    return {
      conversationId: conversation.id,
    }
  }
)

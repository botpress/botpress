import { RuntimeError } from '@botpress/client'
import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const startChannelConversation = wrapActionAndInjectSlackClient(
  { actionName: 'startChannelConversation', errorMessage: 'Failed to start Channel conversation' },
  async ({ client, logger, slackClient }, { channelName }) => {
    const slackChannelInfo = await slackClient.getChannelInfo({ channelName })
    if (slackChannelInfo === undefined) {
      const errorMessage = `The channel "${channelName}" does not exist or your bot does not have access to it`
      logger.forBot().error(errorMessage)
      throw new RuntimeError(errorMessage)
    }

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: { id: slackChannelInfo?.id },
    })

    return {
      conversationId: conversation.id,
    }
  }
)

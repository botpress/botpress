import { RuntimeError } from '@botpress/client'
import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const getOrCreateChannelConversation = wrapActionAndInjectSlackClient(
  { actionName: 'getOrCreateChannelConversation', errorMessage: 'Failed to get or create Channel conversation' },
  async ({ client, logger, slackClient }, { channelId, channelName }) => {
    let resolvedChannelId: string | undefined = channelId

    if (!resolvedChannelId) {
      if (!channelName) {
        throw new RuntimeError('Either channelId or channelName must be provided')
      }

      const slackChannelInfo = await slackClient.getChannelInfo({ channelName })
      if (slackChannelInfo === undefined) {
        const errorMessage = `The channel "${channelName}" does not exist or your bot does not have access to it`
        logger.forBot().error(errorMessage)
        throw new RuntimeError(errorMessage)
      }

      resolvedChannelId = slackChannelInfo.id
    }

    const { conversation: bpConversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: { id: resolvedChannelId },
    })

    return {
      conversationId: bpConversation.id,
    }
  }
)

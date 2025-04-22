import * as sdk from '@botpress/sdk'
import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'
import { retrieveChannelAndMessageTs } from './utils/message-utils'

export const addReaction = wrapActionAndInjectSlackClient(
  { actionName: 'addReaction', errorMessage: 'Failed to add reaction' },
  async ({ client, logger, slackClient }, { messageId, name }) => {
    if (!messageId) {
      throw new sdk.RuntimeError('Missing Botpress message ID')
    }

    const { channel, ts } = await retrieveChannelAndMessageTs({
      client,
      messageId,
    })

    logger.forBot().debug('Sending reaction to Slack')

    await slackClient.addReactionToMessage({
      channelId: channel,
      messageTs: ts,
      reactionName: name,
    })
  }
)

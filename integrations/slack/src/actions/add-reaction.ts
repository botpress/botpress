import * as sdk from '@botpress/sdk'
import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'
import { retrieveChannelAndMessageTs } from './utils/message-utils'

export const addReaction = wrapActionAndInjectSlackClient(
  { actionName: 'addReaction', errorMessage: 'Failed to add reaction' },
  async ({ client, logger, slackClient }, { messageId, name }) => {
    if (!messageId) {
      throw new sdk.RuntimeError('Missing Botpress message ID')
    }

    const result = await retrieveChannelAndMessageTs({
      client,
      messageId,
    })

    if (!result) {
      logger.forBot().debug(`Skipping reaction for message ${messageId} — missing Slack channel or timestamp`)
      return
    }

    const { channel, ts } = result

    logger.forBot().debug('Sending reaction to Slack')

    await slackClient.addReactionToMessage({
      channelId: channel,
      messageTs: ts,
      reactionName: name,
    })
  }
)

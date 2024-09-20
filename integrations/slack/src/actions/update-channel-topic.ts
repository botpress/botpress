import { WebClient } from '@slack/web-api'
import { getAccessToken } from 'src/misc/utils'
import { Integration } from '.botpress'

export const updateChannelTopic: Integration['actions']['updateChannelTopic'] = async ({
  logger,
  client,
  input,
  ctx,
}) => {
  logger.forBot().debug('Received action updateChannelTopic with input:', input)

  const { channelId, topic } = input

  try {
    const accessToken = await getAccessToken(client, ctx)
    const slackClient = new WebClient(accessToken)
    await slackClient.conversations.setTopic({ channel: channelId, topic })
    return {}
  } catch (err) {
    logger.forBot().error('Could not update channel topic', err)
    throw new Error(`Could not update channel topic: ${err}`)
  }
}

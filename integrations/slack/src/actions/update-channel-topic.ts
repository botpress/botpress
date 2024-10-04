import { wrapActionAndInjectSlackClient } from './action-wrapper'

export const updateChannelTopic = wrapActionAndInjectSlackClient('updateChannelTopic', {
  async action({ slackClient }, { channelId, topic }) {
    await slackClient.conversations.setTopic({ channel: channelId, topic })
    return {}
  },
  errorMessage: 'Failed to update channel topic',
})

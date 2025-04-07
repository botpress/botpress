import { wrapActionAndInjectSlackClient } from './action-wrapper'

export const updateChannelTopic = wrapActionAndInjectSlackClient(
  { actionName: 'updateChannelTopic', errorMessage: 'Failed to update channel topic' },
  async ({ slackClient }, { channelId, topic }) => {
    await slackClient.setConversationTopic({ channelId, topic })
  }
)

import { SlackScopes } from 'src/misc/slack-scopes'
import { wrapActionAndInjectSlackClient } from './action-wrapper'

export const updateChannelTopic = wrapActionAndInjectSlackClient('updateChannelTopic', {
  async action({ slackClient, client, ctx }, { channelId, topic }) {
    await SlackScopes.ensureHasAllScopes({
      client,
      ctx,
      requiredScopes: ['channels:write', 'groups:write', 'mpim:write', 'im:write'],
      operation: 'conversations.setTopic',
    })

    await slackClient.conversations.setTopic({ channel: channelId, topic })

    return {}
  },
  errorMessage: 'Failed to update channel topic',
})

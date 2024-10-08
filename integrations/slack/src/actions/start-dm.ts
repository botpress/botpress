import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'
import { SlackScopes } from 'src/misc/slack-scopes'

export const startDmConversation = wrapActionAndInjectSlackClient('startDmConversation', {
  async action({ client, slackClient, ctx }, { slackUserId }) {
    const { user } = await client.getOrCreateUser({
      tags: {
        id: slackUserId,
      },
    })

    if (user.tags.dm_conversation_id) {
      return {
        conversationId: user.tags.dm_conversation_id,
        userId: user.id,
      }
    }

    await SlackScopes.ensureHasAllScopes({
      client,
      ctx,
      requiredScopes: ['im:write'],
      operation: 'conversations.open',
    })

    const { ok, channel } = await slackClient.conversations.open({
      users: slackUserId,
    })

    if (!ok || !channel) {
      throw new Error('Could not open conversation')
    }

    const { conversation } = await client.getOrCreateConversation({
      channel: 'dm',
      tags: {
        id: channel.id,
      },
    })

    await client.updateConversation({
      id: conversation.id,
      tags: {
        title: `DM with ${user.name}`,
        id: channel.id,
      },
    })

    await client.updateUser({
      id: user.id,
      tags: {
        dm_conversation_id: conversation.id,
        id: slackUserId,
      },
    })

    return {
      conversationId: conversation.id,
      userId: user.id,
    }
  },
  errorMessage: 'Failed to start DM conversation',
})

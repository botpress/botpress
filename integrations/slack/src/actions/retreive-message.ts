import { WebClient } from '@slack/web-api'
import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'
import { SlackScopes } from 'src/misc/slack-scopes'
import { getAccessToken } from '../misc/utils'

export const retrieveMessage = wrapActionAndInjectSlackClient('retrieveMessage', {
  async action({ client, ctx, logger }, { ts, channel }) {
    const accessToken = await getAccessToken(client, ctx)
    const slackClient = new WebClient(accessToken)

    await SlackScopes.ensureHasAllScopes({
      client,
      ctx,
      requiredScopes: ['channels:history', 'groups:history', 'im:history', 'mpim:history'],
      operation: 'conversations.history',
    })

    const response = await slackClient.conversations.history({
      limit: 1,
      inclusive: true,
      latest: ts,
      channel,
    })

    if (!response.ok) {
      logger.forBot().error('Could not retrieve message', response.error)
      throw new Error(`Could not retrieve message: ${response.error}`)
    }

    const message = response.messages?.[0]

    if (!message) {
      logger.forBot().error('No message found')
      throw new Error('No message found')
    }

    if (!message.type || !message.ts || !message.user || !message.text) {
      logger.forBot().error('Message is missing required fields')
      throw new Error('Message is missing required fields')
    }

    return {
      type: message.type,
      ts: message.ts,
      user: message.user,
      text: message.text,
    }
  },
  errorMessage: 'Failed to retrieve message',
})

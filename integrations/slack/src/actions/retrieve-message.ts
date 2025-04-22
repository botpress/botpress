import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const retrieveMessage = wrapActionAndInjectSlackClient(
  { actionName: 'retrieveMessage', errorMessage: 'Failed to retrieve message' },
  async ({ logger, slackClient }, { ts, channel }) => {
    const message = await slackClient.retrieveMessage({ channel, messageTs: ts })

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
  }
)

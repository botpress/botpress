import { WebClient } from '@slack/web-api'
import { Integration } from '.botpress'

export const retrieveMessage: Integration['actions']['retrieveMessage'] = async ({ ctx, input, logger }) => {
  const slackClient = new WebClient(ctx.configuration.botToken)

  const response = await slackClient.conversations.history({
    limit: 1,
    inclusive: true,
    latest: input.ts,
    channel: input.channel,
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
}

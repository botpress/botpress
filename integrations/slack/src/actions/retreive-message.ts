import { WebClient } from '@slack/web-api'
import { Integration } from '.botpress'

export const retrieveMessage: Integration['actions']['retrievegMessage'] = async ({ ctx, input }) => {
  const slackClient = new WebClient(ctx.configuration.botToken)

  const response = await slackClient.conversations.history({
    limit: 1,
    inclusive: true,
    latest: input.ts,
    channel: input.channel,
  })

  if (response.ok) {
    throw new Error(`Could not retrieve message: ${response.error}`)
  }

  const message = response.messages?.[0]

  if (!message) {
    throw new Error('Message not found')
  }

  if (!message.type || !message.ts || !message.user || !message.text) {
    throw new Error('Message is missing required fields')
  }

  return {
    type: message.type,
    ts: message.ts,
    user: message.user,
    text: message.text,
  }
}

import { WebClient } from '@slack/web-api'
import { getAccessToken } from '../misc/utils'
import { Integration } from '.botpress'

export const retrieveMessage: Integration['actions']['retrieveMessage'] = async ({ client, ctx, input, logger }) => {
  logger.forBot().debug('Received action retrieveMessage with input:', input)
  const accessToken = await getAccessToken(client, ctx)
  const slackClient = new WebClient(accessToken)

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

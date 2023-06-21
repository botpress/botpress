import type { GenericMessageEvent, ReactionAddedEvent } from '@slack/bolt'

import { executeMessageReceived } from './events/message-received'
import { executeReactionAdded } from './events/reaction-added'
import {
  isInteractiveRequest,
  onOAuth,
  parseInteractiveBody,
  respondInteractive,
  getUserAndConversation,
  getConfig,
} from './misc/utils'

import * as botpress from '.botpress'

export const handler: botpress.IntegrationProps['handler'] = async ({ req, ctx, client }) => {
  if (req.path.startsWith('/oauth')) {
    return onOAuth()
  }

  if (!req.body) {
    console.warn('Handler received an empty body')
    return
  }

  const { botUserId } = await getConfig(client, ctx)

  if (isInteractiveRequest(req)) {
    const body = parseInteractiveBody(req)
    const actionValue = await respondInteractive(body)

    if (body.type !== 'block_actions') {
      throw Error(`Interaction type ${body.type} is not supported yet`)
    }

    await client.createMessage({
      tags: { ts: body.message.ts },
      type: 'text',
      payload: { text: actionValue },
      ...(await getUserAndConversation({ slackUserId: body.user.id, slackChannelId: body.channel.id }, client)),
    })

    return
  }

  const data = JSON.parse(req.body)

  if (data.type === 'url_verification') {
    console.info('Handler received request of type url_verification')
    return {
      body: JSON.stringify({ challenge: data.challenge }),
    }
  }

  const event: ReactionAddedEvent | GenericMessageEvent = data.event
  console.info(`Handler received request of type ${data.event.type}`)

  switch (event.type) {
    case 'message':
      return executeMessageReceived({ slackEvent: event, client })

    case 'reaction_added':
      if (event.user !== botUserId) {
        return executeReactionAdded({ slackEvent: event, client })
      }

      return

    default:
      return
  }
}

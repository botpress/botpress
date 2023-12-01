import type { GenericMessageEvent, ReactionAddedEvent } from '@slack/bolt'

import { channelIdTag, userIdTag } from './const'
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

export const handler: botpress.IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  logger.forBot().debug('Handler received request from Slack with payload:', req.body)
  if (req.path.startsWith('/oauth')) {
    return onOAuth(req, client, ctx).catch((err) => {
      logger.forBot().error('Error while processing OAuth', err.response?.data || err.message)
      throw err
    })
  }

  if (!req.body) {
    logger.forBot().warn('Handler received an empty body, so the message was ignored')
    return
  }

  const { botUserId } = await getConfig(client, ctx)

  if (isInteractiveRequest(req)) {
    const body = parseInteractiveBody(req)
    const actionValue = await respondInteractive(body)

    if (body.type !== 'block_actions') {
      const errMessage = `Interaction type ${body.type} received from Slack is not supported yet`
      logger.forBot().error(errMessage)
      return
    }

    const { userId, conversationId } = await getUserAndConversation(
      { slackUserId: body.user.id, slackChannelId: body.channel.id },
      client
    )

    await client.createMessage({
      tags: { ts: body.message.ts, [userIdTag]: body.user.id, [channelIdTag]: body.channel.id },
      type: 'text',
      payload: { text: actionValue },
      userId,
      conversationId,
    })

    return
  }

  const data = JSON.parse(req.body)

  if (data.type === 'url_verification') {
    logger.forBot().debug('Handler received request of type url_verification')
    return {
      body: JSON.stringify({ challenge: data.challenge }),
    }
  }

  const event: ReactionAddedEvent | GenericMessageEvent = data.event
  logger.forBot().debug(`Handler received request of type ${data.event.type}`)

  switch (event.type) {
    case 'message':
      return executeMessageReceived({ slackEvent: event, client, ctx, logger })

    case 'reaction_added':
      if (event.user !== botUserId) {
        return executeReactionAdded({ slackEvent: event, client })
      }

      return

    default:
      return
  }
}

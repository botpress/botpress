import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import path from 'path'

import Database from './db'
import { convertPayload } from './renderer'

const outgoingTypes = ['text', 'typing', 'login_prompt', 'file', 'carousel', 'custom', 'data']

export default async (bp: typeof sdk, db: Database) => {
  const config: any = {} // FIXME
  const { botName = 'Bot', botAvatarUrl = undefined } = config || {} // FIXME

  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = webchat.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: 'web.sendMessages',
    order: 100
  })

  async function outgoingHandler(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'web') {
      return next()
    }

    const userId = event.target
    const conversationId = event.threadId || (await db.getOrCreateRecentConversation(event.botId, userId))

    event.payload = convertPayload(event.payload)

    if (event.payload.metadata) {
      event.payload = await applyChannelEffects(event, userId, conversationId)
    }

    event.type = event.payload.type

    const messageType = event.type === 'default' ? 'text' : event.type

    if (!_.includes(outgoingTypes, messageType)) {
      bp.logger.warn(`Unsupported event type: ${event.type}`)
      return next(undefined, true)
    }

    const standardTypes = ['text', 'carousel', 'custom', 'file', 'login_prompt']

    if (!event.payload.type) {
      event.payload.type = messageType
    }

    if (messageType === 'typing') {
      await sendTyping(event, userId, conversationId)
    } else if (messageType === 'data') {
      const payload = bp.RealTimePayload.forVisitor(userId, 'webchat.data', event.payload)
      bp.realtime.sendPayload(payload)
    } else if (standardTypes.includes(messageType)) {
      const message = await db.appendBotMessage(
        (event.payload || {}).botName || botName,
        (event.payload || {}).botAvatarUrl || botAvatarUrl,
        conversationId,
        event.payload,
        event.incomingEventId
      )
      bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(userId, 'webchat.message', message))
    } else {
      bp.logger.warn(`Message type "${messageType}" not implemented yet`)
    }

    next(undefined, false)
    // TODO Make official API (BotpressAPI.events.updateStatus(event.id, 'done'))
  }

  const sendTyping = async (event, userId, conversationId) => {
    const typing = parseTyping(event.payload.value)
    const payload = bp.RealTimePayload.forVisitor(userId, 'webchat.typing', { timeInMs: typing, conversationId })
    // Don't store "typing" in DB
    bp.realtime.sendPayload(payload)
    // await Promise.delay(typing)
  }

  const applyChannelEffects = async (event: sdk.IO.OutgoingEvent, userId, conversationId) => {
    let payload = event.payload

    const {
      __buttons,
      __typing,
      __trimText,
      __markdown,
      __dropdown,
      __collectFeedback
    } = payload.metadata as sdk.Content.Metadata

    if (__typing) {
      await sendTyping(event, userId, conversationId)
    }

    if (__trimText && !isNaN(__trimText)) {
      payload.trimLength = __trimText
    }

    if (__markdown) {
      payload.markdown = true
    }

    if (__collectFeedback) {
      payload.collectFeedback = true
    }

    if (__buttons) {
      payload = {
        type: 'custom',
        module: 'channel-web',
        component: 'QuickReplies',
        quick_replies: __buttons,
        wrapped: {
          type: event.type,
          ..._.omit(event.payload, 'quick_replies')
        }
      }
    }

    if (__dropdown) {
      payload = {
        type: 'custom',
        module: 'extensions',
        component: 'Dropdown',
        ...(_.isArray(__dropdown) ? { options: __dropdown } : __dropdown),
        wrapped: {
          type: event.type,
          ..._.omit(event.payload, 'options')
        }
      }
    }

    return payload
  }
}

function parseTyping(typing) {
  if (isNaN(typing)) {
    return 500
  }

  return Math.max(typing, 500)
}

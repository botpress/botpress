import * as sdk from 'botpress/sdk'

import _ from 'lodash'
import path from 'path'

import Database from './db'

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

  async function outgoingHandler(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'web') {
      return next()
    }

    const messageType = event.type === 'default' ? 'text' : event.type
    const userId = event.target
    const conversationId = event.threadId || (await db.getOrCreateRecentConversation(event.botId, userId))

    if (!_.includes(outgoingTypes, messageType)) {
      return next(new Error('Unsupported event type: ' + event.type))
    }

    const standardTypes = ['text', 'carousel', 'custom', 'file', 'login_prompt']

    if (!event.payload.type) {
      event.payload.type = messageType
    }

    if (messageType === 'typing') {
      const typing = parseTyping(event.payload.value)
      const payload = bp.RealTimePayload.forVisitor(userId, 'webchat.typing', { timeInMs: typing, conversationId })
      // Don't store "typing" in DB
      bp.realtime.sendPayload(payload)
      await Promise.delay(typing)
    } else if (messageType === 'data') {
      const payload = bp.RealTimePayload.forVisitor(userId, 'webchat.data', event.payload)
      bp.realtime.sendPayload(payload)
    } else if (standardTypes.includes(messageType)) {
      const message = await db.appendBotMessage(botName, botAvatarUrl, conversationId, event.payload)
      bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(userId, 'webchat.message', message))
    } else {
      throw new Error(`Message type "${messageType}" not implemented yet`)
    }

    next(undefined, false)
    // TODO Make official API (BotpressAPI.events.updateStatus(event.id, 'done'))
  }
}

function parseTyping(typing) {
  if (isNaN(typing)) {
    return 1000
  }

  return Math.max(typing, 500)
}

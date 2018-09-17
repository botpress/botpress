import { BotpressAPI, BotpressEvent } from 'botpress-module-sdk'
import { RealTimePayload } from 'botpress-module-sdk/dist/src/realtime'
import _ from 'lodash'
import mime from 'mime'
import path from 'path'

import { Extension } from '.'
import Database from './db'

const outgoingTypes = ['text', 'typing', 'login_prompt', 'file', 'carousel', 'custom']

export default async (bp: BotpressAPI & Extension, db: Database) => {
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

  async function outgoingHandler(event: BotpressEvent, next: Function) {
    if (event.channel !== 'web') {
      return next()
    }

    const messageType = event.type === 'default' ? 'text' : event.type
    const userId = event.target
    const conversationId = event.threadId || (await db.getOrCreateRecentConversation(event.botId, userId))

    if (!_.includes(outgoingTypes, messageType)) {
      return next('Unsupported event type: ' + event.type)
    }

    if (messageType === 'typing') {
      const typing = parseTyping(event.payload.value)
      const payload = RealTimePayload.forVisitor(userId, 'webchat.typing', { timeInMs: typing, conversationId })
      // Don't store "typing" in DB
      bp.realtime.sendPayload(payload)
      await Promise.delay(typing)
    } else if (messageType === 'text' || messageType === 'carousel') {
      const message = await db.appendBotMessage(botName, botAvatarUrl, conversationId, {
        data: event.payload,
        raw: event.payload,
        text: event.preview,
        type: messageType
      })

      bp.realtime.sendPayload(RealTimePayload.forVisitor(userId, 'webchat.message', message))
    } else if (messageType === 'file') {
      const extension = path.extname(event.payload.url)
      const mimeType = mime.getType(extension)
      const basename = path.basename(event.payload.url, extension)

      const message = await db.appendBotMessage(botName, botAvatarUrl, conversationId, {
        data: { storage: 'storage', mime: mimeType, name: basename, ...event.payload },
        raw: event.payload,
        text: event.preview,
        type: messageType
      })

      bp.realtime.sendPayload(RealTimePayload.forVisitor(userId, 'webchat.message', message))
    } else {
      throw new Error(`Message type "${messageType}" not implemented yet`)
    }

    // FIXME Make official API (BotpressAPI.events.updateStatus(event.id, 'done'))
  }
}

function parseTyping(typing) {
  if (isNaN(typing)) {
    return 1000
  }

  return Math.max(typing, 500)
}

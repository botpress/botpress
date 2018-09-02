import { BotpressAPI, BotpressEvent } from 'botpress-module-sdk'
import { RealTimePayload } from 'botpress-module-sdk/dist/src/realtime'
import _ from 'lodash'

import { Extension } from '.'
import Database from './db'

const outgoingTypes = ['text', 'login_prompt', 'file', 'carousel', 'custom']

export default async (bp: BotpressAPI & Extension, db: Database) => {
  const { appendBotMessage, getOrCreateRecentConversation } = db

  const config: any = {} // FIXME
  const { botName = 'Bot', botAvatarUrl = undefined } = config || {} // FIXME

  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = webchat.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: 'webchat.sendMessages',
    order: 100
  })

  async function outgoingHandler(event: BotpressEvent, next) {
    if (event.channel !== 'webchat') {
      return next()
    }

    if (!_.includes(outgoingTypes, event.type)) {
      return next('Unsupported event type: ' + event.type)
    }

    const userId = event.target

    const typing = parseTyping(event)

    const conversationId = _.get(event, 'raw.conversationId') || (await getOrCreateRecentConversation(userId)) // FIXME botId

    const socketId = userId.replace(/webchat:/gi, '')

    if (typing) {
      bp.realtime.sendPayload(
        RealTimePayload.forVisitor(socketId, 'webchat.typing', { timeInMs: typing, conversationId })
      )

      await Promise.delay(typing)
    }

    // TODO && FIXME
    const message = await appendBotMessage(botName, botAvatarUrl, conversationId, {
      data: {},
      raw: {},
      text: '',
      type: ''
    })

    bp.realtime.sendPayload(RealTimePayload.forVisitor(socketId, 'webchat.message', message))

    // Resolve the event promise
    // FIXME Make official API (BotpressAPI.events.updateStatus(event.id, 'done'))

    // event._promise && event._resolve && event._resolve()
  }
}

function parseTyping(msg) {
  if (msg.raw && !!msg.raw.typing) {
    if (isNaN(msg.raw.typing)) {
      return 1000
    } else {
      return Math.max(msg.raw.typing, 500)
    }
  }

  return false
}

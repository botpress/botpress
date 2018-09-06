import { BotpressAPI, BotpressEvent } from 'botpress-module-sdk'
import { RealTimePayload } from 'botpress-module-sdk/dist/src/realtime'
import _ from 'lodash'

import { Extension } from '.'
import Database from './db'

const outgoingTypes = ['text', 'login_prompt', 'file', 'carousel', 'custom']

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

    if (event.type !== 'cms-element') {
      return next('Channel web can only send content elements for now')
    }

    const messageType = _.get(event.payload, 'type', 'text')

    if (!_.includes(outgoingTypes, messageType)) {
      return next('Unsupported event type: ' + event.type)
    }

    const userId = event.target
    const typing = parseTyping(event.payload.typing)

    const conversationId = event.threadId || (await db.getOrCreateRecentConversation(userId))

    if (typing) {
      bp.realtime.sendPayload(
        RealTimePayload.forVisitor(userId, 'webchat.typing', { timeInMs: typing, conversationId })
      )

      await Promise.delay(typing)
    }

    const message = await db.appendBotMessage(botName, botAvatarUrl, conversationId, {
      data: event.payload,
      raw: event.payload,
      text: event.preview,
      type: messageType
    })

    bp.realtime.sendPayload(RealTimePayload.forVisitor(userId, 'webchat.message', message))

    // FIXME Make official API (BotpressAPI.events.updateStatus(event.id, 'done'))
  }
}

function parseTyping(typing) {
  if (typing) {
    if (isNaN(typing)) {
      return 1000
    } else {
      return Math.max(typing, 500)
    }
  }

  return false
}

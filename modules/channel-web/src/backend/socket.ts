import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import Database from './db'

export default async (bp: typeof sdk, db: Database) => {
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

    const messaging = await db.getMessagingClient(event.botId)
    const messageType = event.type === 'default' ? 'text' : event.type
    const userId = event.target
    const { visitorId } = await db.getMappingFromUser(event.botId, userId)
    const conversationId = event.threadId || (await messaging.getMostRecentConversationForUser(userId)).id

    if (!event.payload.type) {
      event.payload.type = messageType
    }

    if (messageType === 'data') {
      const payload = bp.RealTimePayload.forVisitor(visitorId, 'webchat.data', event.payload)
      bp.realtime.sendPayload(payload)
    } else {
      const typing = parseTyping(event.payload.value)
      const payload = bp.RealTimePayload.forVisitor(visitorId, 'webchat.typing', { timeInMs: typing, conversationId })
      // Don't store "typing" in DB
      bp.realtime.sendPayload(payload)

      const message = await messaging.createMessage(conversationId, undefined, event.payload)
      event.messageId = message.id

      bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(visitorId, 'webchat.message', message))
    }

    next(undefined, false)
  }
}

function parseTyping(typing) {
  if (isNaN(typing)) {
    return 1000
  }

  return Math.max(typing, 500)
}

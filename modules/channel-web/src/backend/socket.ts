import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import Database from './db'

const DEFAULT_TYPING_DELAY = 500

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

    const messaging = bp.messaging.forBot(event.botId)
    const messageType = event.type === 'default' ? 'text' : event.type
    const userId = event.target
    const mapping = await db.getMappingFromUser(userId)
    if (!mapping) {
      bp.logger.warn(`Can't send message. User ${userId} not associated to a visitor id`)
      return next()
    }
    const { visitorId } = mapping
    let conversationId = event.threadId
    if (!conversationId) {
      const convs = await messaging.listConversations(userId, 1)
      if (convs?.length) {
        conversationId = convs[0].id
      } else {
        conversationId = (await messaging.createConversation(userId)).id
      }
    }

    if (!event.payload.type) {
      event.payload.type = messageType
    }

    if (messageType === 'data') {
      const payload = bp.RealTimePayload.forVisitor(visitorId, 'webchat.data', event.payload)
      bp.realtime.sendPayload(payload)
    } else {
      if (event.payload.typing === true || event.payload.type === 'typing') {
        const value = (event.payload.type === 'typing' ? event.payload.value : undefined) || DEFAULT_TYPING_DELAY
        const payload = bp.RealTimePayload.forVisitor(visitorId, 'webchat.typing', { timeInMs: value, conversationId })
        // Don't store "typing" in DB
        bp.realtime.sendPayload(payload)
      }

      if (event.payload.type !== 'typing') {
        const message = await messaging.createMessage(conversationId, undefined, event.payload)
        event.messageId = message.id
        bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(visitorId, 'webchat.message', message))
      }
    }

    next(undefined, false)
  }
}

import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { SDK } from '.'
import Database from './db'

export default async (bp: SDK, db: Database) => {
  bp.events.registerMiddleware({
    name: 'hitl.captureInMessages',
    direction: 'incoming',
    order: 2,
    handler: incomingHandler,
    description: 'Captures incoming messages and if the session if paused, swallow the event.',
    enabled: true
  })

  bp.events.registerMiddleware({
    name: 'hitl.captureOutMessages',
    direction: 'outgoing',
    order: 50,
    handler: outgoingHandler,
    description: 'Captures outgoing messages to show inside HITL.',
    enabled: true
  })

  async function incomingHandler(event: sdk.IO.Event, next) {
    if (!db) {
      return next()
    }

    if (_.includes(['delivery', 'read'], event.type)) {
      return next()
    }

    const session = await db.getUserSession(event)
    if (!session) {
      return next()
    }

    if (session.is_new_session) {
      bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(event.target, 'hitl.session', session))
    }

    const message = db.appendMessageToSession(event, session.id, 'in')
    bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(event.target, 'hitl.message', message))

    const config = await bp.config.getModuleConfigForBot('hitl', event.botId)

    if ((!!session.paused || config.paused) && _.includes(['text', 'message'], event.type)) {
      bp.logger.debug('Session paused, message swallowed:', event.preview)
      // the session or bot is paused, swallow the message
      return
    }
    next()
  }

  async function outgoingHandler(event: sdk.IO.Event, next) {
    if (!db) {
      return next()
    }

    const session = await db.getUserSession(event)
    if (!session) {
      return next()
    }

    if (session.is_new_session) {
      bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(event.target, 'hitl.session', session))
    }

    const message = db.appendMessageToSession(event, session.id, 'out')
    bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(event.target, 'hitl.message', message))
    next()
  }
}

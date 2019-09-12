import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { SDK } from '.'
import Database from './db'

const debug = DEBUG('hitl')
const debugSwallow = debug.sub('swallow')

const ignoredTypes = ['delivery', 'read']

export default async (bp: SDK, db: Database) => {
  bp.events.registerMiddleware({
    name: 'hitl.captureInMessages',
    direction: 'incoming',
    order: 2,
    handler: incomingHandler,
    description: 'Captures incoming messages and if the session if paused, swallow the event.'
  })

  bp.events.registerMiddleware({
    name: 'hitl.captureOutMessages',
    direction: 'outgoing',
    order: 50,
    handler: outgoingHandler,
    description: 'Captures outgoing messages to show inside HITL.'
  })

  async function incomingHandler(event: sdk.IO.IncomingEvent, next) {
    if (!db || ignoredTypes.includes(event.type)) {
      return next()
    }

    const session = await db.getOrCreateUserSession(event)
    if (!session) {
      return next()
    }

    const message = await db.appendMessageToSession(event, session.id, 'in')
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.message', message))

    if (session.is_new_session) {
      bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.new_session', session))
    }

    const config = await bp.config.getModuleConfigForBot('hitl', event.botId)

    if ((!!session.paused || config.paused) && _.includes(['text', 'message', 'quick_reply'], event.type)) {
      debugSwallow('message swallowed / session paused', {
        target: event.target,
        channel: event.channel,
        preview: event.preview,
        type: event.type
      })
      // the session or bot is paused, swallow the message
      // @ts-ignore
      Object.assign(event, { isPause: true })

      return
    }

    next()
  }

  async function outgoingHandler(event: sdk.IO.Event, next) {
    if (!db) {
      return next()
    }

    const session = await db.getOrCreateUserSession(event)
    if (!session) {
      return next()
    }

    const message = await db.appendMessageToSession(event, session.id, 'out')
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.message', message))

    if (session.is_new_session) {
      bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.new_session', session))
    }

    next()
  }
}

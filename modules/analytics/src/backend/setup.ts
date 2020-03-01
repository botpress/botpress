import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import Database2 from './db'

export default async (bp: typeof sdk, db: Database2, interactionsToTrack: string[]) => {
  await db.initialize()

  process.BOTPRESS_EVENTS.on('bp_core_decision_elected', ({ channel, botId, source }) => {
    if (source === 'qna') {
      db.incrementMetric(botId, channel, 'msg_sent_qna_count')
    }
  })

  process.BOTPRESS_EVENTS.on('bp_core_session_created', ({ channel, botId }) => {
    db.incrementMetric(botId, channel, 'sessions_count')
  })

  bp.events.registerMiddleware({
    name: 'analytics.incoming',
    direction: 'incoming',
    handler: incomingMiddleware,
    order: 12, // after nlu and qna
    description: 'Tracks incoming messages for Analytics purposes'
  })

  bp.events.registerMiddleware({
    name: 'analytics.outgoing',
    direction: 'outgoing',
    handler: outgoingMiddleware,
    order: 5,
    description: 'Tracks outgoing messages for Analytics purposes'
  })

  function incomingMiddleware(event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) {
    if (!_.includes(interactionsToTrack, event.type)) {
      return next()
    }

    db.incrementMetric(event.botId, event.channel, 'msg_received_count')

    // misunderstood messages
    if (event?.nlu?.intent?.name === 'none' || event?.nlu?.ambiguous) {
      db.incrementMetric(event.botId, event.channel, 'msg_nlu_none')
      if (!event?.state?.session?.lastMessages?.length) {
        db.incrementMetric(event.botId, event.channel, 'sessions_start_nlu_none')
      }
    }

    next()
  }

  function outgoingMiddleware(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (!_.includes(interactionsToTrack, event.type)) {
      return next()
    }

    db.incrementMetric(event.botId, event.channel, 'msg_sent_count')
    next()
  }
}

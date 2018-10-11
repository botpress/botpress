import _ from 'lodash'

import { SDK } from '.'
import Database from './db'
import AnalyticsDb from './db'

export default async (bp: SDK, interactionsToTrack: any) => {
  const db: Database = new AnalyticsDb(bp)
  await db.initializeDb()

  bp.events.registerMiddleware({
    name: 'analytics.incoming',
    direction: 'incoming',
    handler: incomingMiddleware,
    order: 5,
    description: 'Tracks incoming messages for Analytics purposes',
    enabled: true
  })

  bp.events.registerMiddleware({
    name: 'analytics.outgoing',
    direction: 'outgoing',
    handler: outgoingMiddleware,
    order: 5,
    description: 'Tracks outgoing messages for Analytics purposes',
    enabled: true
  })

  function incomingMiddleware(event, next) {
    if (!_.includes(interactionsToTrack, event.type)) {
      return next()
    }

    if (event.user) {
      // Asynchronously save the interaction (non-blocking)
      db.saveIncoming(event)
        .then()
        .catch(() => {
          bp.logger.debug('Could not save incoming interaction for ' + event.platform)
        })
    }

    next()
  }

  function outgoingMiddleware(event, next) {
    if (!_.includes(interactionsToTrack, event.type)) {
      return next()
    }

    // Asynchronously save the interaction (non-blocking)
    db.saveOutgoing(event)
      .then()
      .catch(() => {
        bp.logger.debug('Could not save outgoing interaction for ' + event.platform)
      })

    next()
  }
}

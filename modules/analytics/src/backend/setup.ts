import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { SDK } from '.'
import Database from './db'
import seed from './seed'

export default async (bp: SDK, interactionsToTrack: any) => {
  const db: Database = new Database(bp)
  await db.initializeDb()

  // Dev: uncomment to generate users/interactions
  // seed.run(bp.database)

  bp.events.registerMiddleware({
    name: 'analytics.incoming',
    direction: 'incoming',
    handler: incomingMiddleware,
    order: 5,
    description: 'Tracks incoming messages for Analytics purposes'
  })

  bp.events.registerMiddleware({
    name: 'analytics.outgoing',
    direction: 'outgoing',
    handler: outgoingMiddleware,
    order: 5,
    description: 'Tracks outgoing messages for Analytics purposes'
  })

  function incomingMiddleware(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (!_.includes(interactionsToTrack, event.type)) {
      return next()
    }

    // Asynchronously save the interaction (non-blocking)
    db.saveIncoming(event)
      .then()
      .catch(() => {
        bp.logger.debug('Could not save incoming interaction for ' + event.channel)
      })

    next()
  }

  function outgoingMiddleware(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (!_.includes(interactionsToTrack, event.type)) {
      return next()
    }

    // Asynchronously save the interaction (non-blocking)
    db.saveOutgoing(event)
      .then()
      .catch(() => {
        bp.logger.debug('Could not save outgoing interaction for ' + event.channel)
      })

    next()
  }
}

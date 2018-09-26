import 'bluebird-global'
import checkVersion from 'botpress-version-manager'
import _ from 'lodash'

import Analytics from './analytics'
import CustomAnalytics from './custom-analytics'
import DB from './db'

let analytics = undefined
let db = undefined

const interactionsToTrack = ['message', 'text', 'button', 'template', 'quick_reply', 'postback']

const incomingMiddleware = (event, next) => {
  if (!_.includes(interactionsToTrack, event.type)) {
    return next()
  }

  if (event.user) {
    // Asynchronously save the interaction (non-blocking)
    db &&
      db
        .saveIncoming(event)
        .then()
        .catch(() => {
          event.bp && event.bp.logger.debug('[Analytics] Could not save incoming interaction for ' + event.platform)
        })
  }

  next()
}

const outgoingMiddleware = (event, next) => {
  if (!_.includes(interactionsToTrack, event.type)) {
    return next()
  }

  // Asynchronously save the interaction (non-blocking)
  db &&
    db
      .saveOutgoing(event)
      .then()
      .catch(() => {
        event.bp && event.bp.logger.debug('[Analytics] Could not save outgoing interaction for ' + event.platform)
      })

  next()
}

export const init = bp => {
  checkVersion(bp, bp.botpressPath)

  bp.middlewares.register({
    name: 'analytics.incoming',
    module: 'botpress-analytics',
    type: 'incoming',
    handler: incomingMiddleware,
    order: 5,
    description: 'Tracks incoming messages for Analytics purposes'
  })

  bp.middlewares.register({
    name: 'analytics.outgoing',
    module: 'botpress-analytics',
    type: 'outgoing',
    handler: outgoingMiddleware,
    description: 'Tracks outgoing messages for Analytics purposes'
  })

  bp.analytics = {
    custom: CustomAnalytics({ bp })
  }

  bp.db.get().then(knex => {
    db = DB(knex, bp)
    return db.initializeDb().then(() => (analytics = new Analytics(bp)))
  })
}

export const ready = bp => {
  bp.getRouter('botpress-analytics').get('/graphs', (req, res, next) => {
    res.send(analytics.getChartsGraphData())
  })

  bp.getRouter('botpress-analytics').get('/metadata', (req, res, next) => {
    analytics.getAnalyticsMetadata().then(metadata => res.send(metadata))
  })

  bp.getRouter('botpress-analytics').get('/custom_metrics', async (req, res, next) => {
    const metrics = await bp.analytics.custom.getAll(req.query.from, req.query.to)
    res.send(metrics)
  })
}

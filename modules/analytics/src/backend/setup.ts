import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import Database from './db'

export default async (bp: typeof sdk, db: Database, interactionsToTrack: string[]) => {
  await db.initialize()

  const removeExt = (name: string) => name?.replace(/\.flow\.json$/i, '')

  process.BOTPRESS_EVENTS.on('bp_core_send_content', ({ channel, botId, source, details }) => {
    if (source === 'qna') {
      db.incrementMetric(botId, channel, 'msg_sent_qna_count', details)
    }
  })

  process.BOTPRESS_EVENTS.on('bp_core_session_created', ({ channel, botId }) => {
    db.incrementMetric(botId, channel, 'sessions_count')
  })

  process.BOTPRESS_EVENTS.on('bp_core_enter_flow', ({ channel, botId, flowName }) => {
    db.incrementMetric(botId, channel, 'enter_flow_count', removeExt(flowName))
  })

  process.BOTPRESS_EVENTS.on('bp_core_workflow_started', ({ channel, botId, wfName }) => {
    db.incrementMetric(botId, channel, 'workflow_started_count', removeExt(wfName))
  })

  process.BOTPRESS_EVENTS.on('bp_core_workflow_completed', ({ channel, botId, wfName }) => {
    db.incrementMetric(botId, channel, 'workflow_completed_count', removeExt(wfName))
  })

  process.BOTPRESS_EVENTS.on('bp_core_workflow_failed', ({ channel, botId, wfName }) => {
    db.incrementMetric(botId, channel, 'workflow_failed_count', removeExt(wfName))
  })

  process.BOTPRESS_EVENTS.on('bp_core_feedback_positive', ({ channel, botId, type, details }) => {
    if (type === 'qna') {
      db.incrementMetric(botId, channel, 'feedback_positive_qna', details)
    } else if (type === 'workflow') {
      db.incrementMetric(botId, channel, 'feedback_positive_workflow')
    }
  })

  process.BOTPRESS_EVENTS.on('bp_core_feedback_negative', ({ channel, botId, type, details }) => {
    if (type === 'qna') {
      db.incrementMetric(botId, channel, 'feedback_negative_qna', details)
    } else if (type === 'workflow') {
      db.incrementMetric(botId, channel, 'feedback_negative_workflow')
    }
  })

  bp.events.registerMiddleware({
    name: 'analytics.incoming',
    direction: 'incoming',
    handler: incomingMiddleware,
    order: 140, // after nlu election and qna
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

    // quick replies aren't counted as misunderstood
    if (event.type === 'quick_reply') {
      return next()
    }

    // misunderstood messages
    const intentName = event?.nlu?.intent?.name
    if (intentName === 'none' || event?.nlu?.ambiguous) {
      if (!event?.state?.session?.lastMessages?.length) {
        db.incrementMetric(event.botId, event.channel, 'sessions_start_nlu_none')
      }
    }
    if (!!intentName?.length) {
      db.incrementMetric(event.botId, event.channel, 'msg_nlu_intent', event.nlu?.intent?.name)
    }

    const language = event.nlu?.language
    if (language) {
      db.incrementMetric(event.botId, event.channel, 'msg_nlu_language', language)
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

import * as sdk from 'botpress/sdk'

import { Extension } from '.'
import Database from './db'

export default async (bp: typeof sdk & Extension, db: Database) => {
  bp.hitl = {
    pause: (platform, userId) => {
      return db.setSessionPaused(true, platform, userId, 'code').then(sessionId => {
        bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(userId, 'hitl.session', { id: sessionId }))
        bp.realtime.sendPayload(
          bp.RealTimePayload.forVisitor(userId, 'hitl.session.changed', { id: sessionId, paused: 1 })
        )
      })
    },
    unpause: (platform, userId) => {
      return db.setSessionPaused(false, platform, userId, 'code').then(sessionId => {
        bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(userId, 'hitl.session', { id: sessionId }))
        bp.realtime.sendPayload(
          bp.RealTimePayload.forVisitor(userId, 'hitl.session.changed', { id: sessionId, paused: 0 })
        )
      })
    },
    isPaused: (platform, userId) => {
      return db.isSessionPaused(platform, userId)
    }
  }

  const router = bp.http.createRouterForBot('botpress-hitl')

  router.get('/sessions', (req, res) => {
    db.getAllSessions(req.query.onlyPaused === 'true').then(sessions => res.send(sessions))
  })

  router.get('/sessions/:sessionId', (req, res) => {
    db.getSessionData(req.params.sessionId).then(messages => res.send(messages))
  })

  router.post('/sessions/:sessionId/message', (req, res) => {
    const { message } = req.body

    db.getSession(req.params.sessionId).then(async session => {
      const event = bp.IO.Event({
        type: 'text',
        channel: session.platform,
        direction: 'outgoing',
        payload: { text: message },
        target: session.userId,
        botId: undefined
      })

      await bp.events.sendEvent(event)

      res.sendStatus(200)
    })
  })

  // TODO post /sessions/:id/typing

  router.post('/sessions/:sessionId/pause', (req, res) => {
    db.setSessionPaused(true, undefined, undefined, 'operator', req.params.sessionId)
      .then(sessionId => {
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session', { id: sessionId }))
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session.changed', { id: sessionId, paused: 1 }))
      })
      .then(res.sendStatus(200))
  })

  router.post('/sessions/:sessionId/unpause', (req, res) => {
    db.setSessionPaused(false, undefined, undefined, 'operator', req.params.sessionId)
      .then(sessionId => {
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session', { id: sessionId }))
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session.changed', { id: sessionId, paused: 0 }))
      })
      .then(res.sendStatus(200))
  })
}

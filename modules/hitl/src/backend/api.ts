import { SDK } from '.'
import Database from './db'

export default async (bp: SDK, db: Database) => {
  bp.hitl = {
    pause: (botId, channel, userId) => {
      return db.setSessionPaused(true, botId, channel, userId, 'code').then(sessionId => {
        bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(userId, 'hitl.session', { id: sessionId }))
        bp.realtime.sendPayload(
          bp.RealTimePayload.forVisitor(userId, 'hitl.session.changed', { id: sessionId, paused: 1 })
        )
      })
    },
    unpause: (botId, channel, userId) => {
      return db.setSessionPaused(false, botId, channel, userId, 'code').then(sessionId => {
        bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(userId, 'hitl.session', { id: sessionId }))
        bp.realtime.sendPayload(
          bp.RealTimePayload.forVisitor(userId, 'hitl.session.changed', { id: sessionId, paused: 0 })
        )
      })
    },
    isPaused: (botId, channel, userId) => {
      return db.isSessionPaused(botId, channel, userId)
    }
  }

  const router = bp.http.createRouterForBot('hitl')

  router.get('/sessions', (req, res) => {
    db.getAllSessions(req.query.onlyPaused === 'true', req.params.botId).then(sessions => res.send(sessions))
  })

  router.get('/sessions/:sessionId', (req, res) => {
    db.getSessionData(req.params.sessionId).then(messages => res.send(messages))
  })

  router.post('/sessions/:sessionId/message', (req, res) => {
    const { message } = req.body

    db.getSession(req.params.sessionId).then(async session => {
      const event = bp.IO.Event({
        type: 'text',
        channel: session.channel,
        direction: 'outgoing',
        payload: { text: message },
        target: session.userId,
        botId: req.params.botId
      })

      await bp.events.sendEvent(event)

      res.sendStatus(200)
    })
  })

  // TODO post /sessions/:id/typing

  router.post('/sessions/:sessionId/pause', (req, res) => {
    db.setSessionPaused(true, undefined, undefined, undefined, 'operator', req.params.sessionId)
      .then(sessionId => {
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session', { id: sessionId }))
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session.changed', { id: sessionId, paused: 1 }))
      })
      .then(res.sendStatus(200))
  })

  router.post('/sessions/:sessionId/unpause', (req, res) => {
    db.setSessionPaused(false, undefined, undefined, undefined, 'operator', req.params.sessionId)
      .then(sessionId => {
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session', { id: sessionId }))
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session.changed', { id: sessionId, paused: 0 }))
      })
      .then(res.sendStatus(200))
  })
}

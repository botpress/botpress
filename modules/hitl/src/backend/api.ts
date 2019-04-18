import { SDK } from '.'
import Database from './db'

export default async (bp: SDK, db: Database) => {
  const router = bp.http.createRouterForBot('hitl')

  router.get('/sessions', (req, res) => {
    db.getAllSessions(req.query.onlyPaused === 'true', req.params.botId).then(sessions => res.send(sessions))
  })

  router.get('/sessions/:sessionId', (req, res) => {
    db.getSessionData(req.params.sessionId).then(messages => res.send(messages))
  })

  router.post('/sessions/:sessionId/message', (req, res) => {
    const { message } = req.body

    db.getSessionById(req.params.sessionId).then(async session => {
      const event = bp.IO.Event({
        type: 'text',
        channel: session.channel,
        direction: 'outgoing',
        payload: {
          text: message,
          preview: message
        },
        target: session.userId,
        botId: req.params.botId
      })

      await bp.events.sendEvent(event)

      res.sendStatus(200)
    })
  })

  // TODO post /sessions/:id/typing

  router.post('/sessions/:sessionId/isPaused', async (req, res) => {
    res.send(await db.isSessionPaused({ sessionId: req.params.sessionId }))
  })

  router.post('/sessions/:sessionId/pause', (req, res) => {
    const { sessionId, trigger = 'operator' } = req.params

    db.setSessionPaused(true, { sessionId }, trigger)
      .then(sessionId => {
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session', { id: sessionId }))
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session.changed', { id: sessionId, paused: 1 }))
      })
      .then(res.sendStatus(200))
  })

  router.post('/sessions/:sessionId/unpause', (req, res) => {
    const { sessionId, trigger = 'operator' } = req.params

    db.setSessionPaused(false, { sessionId }, trigger)
      .then(sessionId => {
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session', { id: sessionId }))
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session.changed', { id: sessionId, paused: 0 }))
      })
      .then(res.sendStatus(200))
  })

  router.post('/channel/:channel/user/:userId/isPaused', async (req, res) => {
    const { botId, channel, userId } = req.params
    res.send(await db.isSessionPaused({ botId, channel, userId }))
  })

  router.post('/channel/:channel/user/:userId/pause', (req, res) => {
    const { botId, channel, userId, trigger = 'operator' } = req.params

    db.setSessionPaused(true, { botId, channel, userId }, trigger)
      .then(sessionId => {
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session', { id: sessionId }))
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session.changed', { id: sessionId, paused: 1 }))
      })
      .then(res.sendStatus(200))
  })

  router.post('/channel/:channel/user/:userId/unpause', (req, res) => {
    const { botId, channel, userId, trigger = 'operator' } = req.params

    db.setSessionPaused(false, { botId, channel, userId }, trigger)
      .then(sessionId => {
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session', { id: sessionId }))
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('hitl.session.changed', { id: sessionId, paused: 0 }))
      })
      .then(res.sendStatus(200))
  })
}

import _ from 'lodash'
import moment from 'moment'

import { SDK } from '.'
import Database from './db'

export default async (bp: SDK, db: Database) => {
  bp.scheduler = {
    add: ({ id, schedule, action, enabled = true, scheduleType = 'once' }) =>
      db
        .create(id, { schedule, action, enabled, schedule_type: scheduleType })
        .then(() => bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('scheduler.update', undefined))),

    remove: id =>
      db.delete(id).then(() => bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('scheduler.update', undefined)))
  }

  const router = bp.http.createRouterForBot('scheduler')

  const catchError = res => err => {
    const message = typeof err === 'string' ? err : err.message
    res.status(500).send({ message })
  }

  router.get('/schedules/upcoming', (req, res) => {
    db.listUpcoming()
      .then(schedules => {
        res.send(
          _.sortBy(schedules, 'scheduledOn').map(s => {
            s.scheduleOn = moment(s.scheduledOn).format()
            s.enabled = !!s.enabled
            return s
          })
        )
      })
      .catch(catchError(res))
  })

  router.get('/schedules/past', (req, res) => {
    db.listPrevious()
      .then(schedules => {
        res.send(
          _.sortBy(schedules, s => -s.scheduledOn).map(s => {
            s.scheduleOn = moment(s.scheduledOn).format()
            s.enabled = !!s.enabled
            return s
          })
        )
      })
      .catch(catchError(res))
  })

  router.put('/schedules', (req, res) => {
    db.create(req.body.id, req.body)
      .then(schedules => {
        res.send(schedules)
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('scheduler.update', undefined))
      })
      .catch(catchError(res))
  })

  router.post('/schedules', (req, res) => {
    db.update(req.body.id, req.body)
      .then(() => {
        res.sendStatus(200)
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('scheduler.update', undefined))
      })
      .catch(catchError(res))
  })

  router.delete('/schedules', (req, res) => {
    db.delete(req.query.id)
      .then(() => {
        res.sendStatus(200)
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('scheduler.update', undefined))
      })
      .catch(catchError(res))
  })

  router.delete('/done', (req, res) => {
    db.deleteDone()
      .then(() => {
        res.sendStatus(200)
        bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('scheduler.update', undefined))
      })
      .catch(catchError(res))
  })
}

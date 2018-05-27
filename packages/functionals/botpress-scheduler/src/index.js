import checkVersion from 'botpress-version-manager'

import moment from 'moment'
import _ from 'lodash'
import Promise from 'bluebird'

import db from './db'
import deamon from './deamon'

module.exports = {
  config: {},

  init: async function(bp) {
    checkVersion(bp, bp.botpressPath)

    await db(bp).bootstrap()
    const d = deamon(bp)
    await d.revive()
    d.start()
  },

  ready: function(bp) {
    const router = bp.getRouter('botpress-scheduler')

    const catchError = res => err => {
      const message = typeof err === 'string' ? err : err.message
      res.status(500).send({ message })
    }

    router.get('/schedules/upcoming', (req, res) => {
      db(bp)
        .listUpcoming()
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
      db(bp)
        .listPrevious()
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
      db(bp)
        .create(req.body.id, req.body)
        .then(schedules => {
          res.send(schedules)
          bp.events.emit('scheduler.update')
        })
        .catch(catchError(res))
    })

    router.post('/schedules', (req, res) => {
      db(bp)
        .update(req.body.id, req.body)
        .then(() => {
          res.sendStatus(200)
          bp.events.emit('scheduler.update')
        })
        .catch(catchError(res))
    })

    router.delete('/schedules', (req, res) => {
      db(bp)
        .delete(req.query.id)
        .then(() => {
          res.sendStatus(200)
          bp.events.emit('scheduler.update')
        })
        .catch(catchError(res))
    })

    router.delete('/done', (req, res) => {
      db(bp)
        .deleteDone()
        .then(() => {
          res.sendStatus(200)
          bp.events.emit('scheduler.update')
        })
        .catch(catchError(res))
    })
  }
}

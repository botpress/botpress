import { SDK } from '.'
import Database from './db'

export default async (bp: SDK, db: Database) => {
  const router = bp.http.createRouterForBot('broadcast')

  router.get('/broadcasts', (req, res, next) => {
    db.listSchedules().then(rows => {
      const broadcasts = rows.map(row => {
        const [date, time] = row.date_time.split(' ')

        const progress = row.total_count ? row.sent_count / row.total_count : db.knex.bool.parse(row.outboxed) ? 1 : 0

        return {
          type: row.type,
          content: row.text,
          outboxed: db.knex.bool.parse(row.outboxed),
          errored: db.knex.bool.parse(row.errored),
          progress: progress,
          userTimezone: !row.ts,
          date: date,
          time: time,
          id: row.id,
          filteringConditions: row.filters && JSON.parse(row.filters)
        }
      })

      res.send(broadcasts)
    })
  })

  router.put('/broadcasts', (req, res, next) => {
    const { date, time, timezone, content, type, filters } = req.body
    db.addSchedule({ date, time, timezone, content, type, filters }).then(id => res.send({ id: id }))
  })

  router.post('/broadcasts', (req, res, next) => {
    const { id, date, time, timezone, content, type, filters } = req.body
    db.updateSchedule({ id, date, time, timezone, content, type, filters })
      .then(() => res.sendStatus(200))
      .catch(err => {
        res.status(500).send({ message: err.message })
      })
  })

  router.delete('/broadcasts/:id', (req, res, next) => {
    db.deleteSchedule(req.params.id)
      .then(() => {
        res.sendStatus(200)
      })
      .catch(err => {
        res.status(500).send({ message: err.message })
      })
  })
}

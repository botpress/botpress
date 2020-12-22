import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw } from 'common/http'

import Database from './db'

export default async (bp: typeof sdk, db: Database) => {
  const asyncMiddleware = asyncMw(bp.logger)
  const router = bp.http.createRouterForBot('broadcast')

  router.get(
    '/',
    asyncMiddleware(async (req, res) => {
      const schedules = await db.listSchedules(req.params.botId)
      const broadcasts = schedules.map(row => {
        const [date, time] = row.date_time.split(' ')
        const progress = row.total_count ? row.sent_count / row.total_count : db.knex.bool.parse(row.outboxed) ? 1 : 0

        return {
          type: row.type,
          content: row.text,
          outboxed: db.knex.bool.parse(row.outboxed),
          errored: db.knex.bool.parse(row.errored),
          progress,
          userTimezone: !row.ts,
          date,
          time,
          id: row.id,
          filteringConditions: row.filters && JSON.parse(row.filters)
        }
      })
      res.send(broadcasts)
    })
  )

  router.post(
    '/create',
    asyncMiddleware(async (req, res) => {
      const { date, time, timezone, content, type, filters } = req.body
      const { botId } = req.params

      await db.addSchedule({ botId, date, time, timezone, content, type, filters })
      res.sendStatus(200)
    })
  )

  router.post(
    '/update',
    asyncMiddleware(async (req, res) => {
      const { id, date, time, timezone, content, type, filters } = req.body
      const { botId } = req.params

      await db.updateSchedule({ id, date, time, timezone, content, type, filters, botId })
      res.sendStatus(200)
    })
  )

  router.post(
    '/delete/:id',
    asyncMiddleware(async (req, res) => {
      await db.deleteSchedule(req.params.id)
      res.sendStatus(200)
    })
  )
}

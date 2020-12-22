import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw, StandardError } from 'common/http'
import _ from 'lodash'
import moment from 'moment'

import Database from './db'

export default (bp: typeof sdk, db: Database) => {
  const asyncMiddleware = asyncMw(bp.logger)
  const router = bp.http.createRouterForBot('analytics')

  router.get(
    '/channel/:channel',
    asyncMiddleware(async (req, res) => {
      const { botId, channel } = req.params
      const { start, end } = req.query

      try {
        const startDate = unixToDate(start)
        const endDate = unixToDate(end)
        const metrics = await db.getMetrics(botId, { startDate, endDate, channel })
        res.send({ metrics })
      } catch (err) {
        throw new StandardError('Cannot get analytics', err)
      }
    })
  )

  const unixToDate = unix => {
    const momentDate = moment.unix(unix)
    if (!momentDate.isValid()) {
      throw new Error(`Invalid unix timestamp format ${unix}.`)
    }

    return moment.utc(momentDate.format('YYYY-MM-DD')).toDate()
  }
}

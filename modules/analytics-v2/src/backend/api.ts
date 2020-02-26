import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import moment from 'moment'

import { Analytics } from '../typings'

import { AnalyticsDatabase } from './db'

export default (bp: typeof sdk, db: AnalyticsDatabase) => {
  const router = bp.http.createRouterForBot('analytics-v2')

  router.get('/channel/:channel', async (req, res) => {
    const { botId, channel } = req.params
    const { start, end } = req.query

    try {
      const startDate = unixToDate(start)
      const endDate = unixToDate(end)

      if (!channel || channel === 'all') {
        const analytics = await db.getBetweenDates(botId, startDate, endDate, undefined)
        res.send({ metrics: analytics.map(toDto) })
      } else {
        const analytics = await db.getBetweenDates(botId, startDate, endDate, channel)
        res.send({ metrics: analytics.map(toDto) })
      }
    } catch (err) {
      res.status(400).send(err.message)
    }
  })

  const toDto = (analytics: Partial<Analytics>) => {
    return _.pick(analytics, ['metric_name', 'value', 'created_on', 'channel'])
  }

  const unixToDate = unix => {
    const momentDate = moment.unix(unix)
    if (!momentDate.isValid()) {
      throw new Error(`Invalid unix timestamp format ${unix}.`)
    }

    return momentDate.toDate()
  }
}

import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import moment from 'moment'

import Database from './db'

export default (bp: typeof sdk, db: Database) => {
  const router = bp.http.createRouterForBot('analytics')

  router.get('/channel/:channel', async (req, res) => {
    const { botId, channel } = req.params
    const { start, end } = req.query

    try {
      const startDate = unixToDate(start)
      const endDate = unixToDate(end)
      const metrics = await db.getMetrics(botId, { startDate, endDate, channel })
      res.send({ metrics })
    } catch (err) {
      res.status(400).send(err.message)
    }
  })

  const unixToDate = unix => {
    const momentDate = moment.unix(unix)
    if (!momentDate.isValid()) {
      throw new Error(`Invalid unix timestamp format ${unix}.`)
    }

    return momentDate.toDate()
  }
}

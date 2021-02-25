import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw } from 'common/http'
import { upperFirst } from 'lodash'
import migrateBot from './migrate'

export default async (bp: typeof sdk) => {
  const asyncMiddleware = asyncMw(bp.logger)
  const router = bp.http.createRouterForBot('ndu')

  router.get(
    '/events',
    asyncMiddleware(async (req, res) => {
      res.send(
        await bp
          .database('events')
          .select('*')
          .where({ botId: req.params.botId, direction: 'incoming' })
          .orderBy('createdOn', 'desc')
          .limit(100)
      )
    })
  )

  router.post(
    '/migrate',
    asyncMiddleware(async (req, res) => {
      try {
        await migrateBot(bp, req.params.botId)
        res.sendStatus(200)
      } catch (err) {
        res.status(400).send(err.message)
      }
    })
  )

  router.get(
    '/channels',
    asyncMiddleware(async (_req, res) => {
      const channels = Object.keys(process.LOADED_MODULES)
        .filter(x => x.startsWith('channel'))
        .map(x => {
          const value = x.replace('channel-', '')
          return { label: upperFirst(value), value }
        })

      res.send([...channels, { label: 'Converse', value: 'api' }])
    })
  )
}

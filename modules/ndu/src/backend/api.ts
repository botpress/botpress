import * as sdk from 'botpress/sdk'
import { upperFirst } from 'lodash'

import migrateBot from './migrate'

export default async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('ndu')

  router.get('/events', async (req, res) => {
    res.send(
      await bp
        .database('events')
        .select('*')
        .where({ botId: req.params.botId, direction: 'incoming' })
        .orderBy('createdOn', 'desc')
        .limit(100)
    )
  })

  router.post('/migrate', async (req, res) => {
    try {
      await migrateBot(bp, req.params.botId)
      res.sendStatus(200)
    } catch (err) {
      res.status(400).send(err.message)
    }
  })

  router.get('/channels', async (_req, res) => {
    const channels = Object.keys(process.LOADED_MODULES)
      .filter(x => x.startsWith('channel'))
      .map(x => {
        const value = x.replace('channel-', '')
        return { label: upperFirst(value), value }
      })

    res.send([...channels, { label: 'Converse', value: 'api' }])
  })
}

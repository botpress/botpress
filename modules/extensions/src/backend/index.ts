import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw } from 'common/http'

import en from '../translations/en.json'
import es from '../translations/es.json'
import fr from '../translations/fr.json'

const onServerReady = async (bp: typeof sdk) => {
  const asyncMiddleware = asyncMw(bp.logger)
  const router = bp.http.createRouterForBot('extensions')
  const config = (await bp.config.getBotpressConfig()).eventCollector

  router.get('/events/update-frequency', async (_req, res) => {
    res.send({ collectionInterval: config.collectionInterval })
  })

  router.get(
    '/events/:eventId',
    asyncMiddleware(async (req, res) => {
      const storedEvents = await bp.events.findEvents({
        incomingEventId: req.params.eventId,
        direction: 'incoming',
        botId: req.params.botId
      })
      if (storedEvents.length) {
        return res.send(storedEvents.map(s => s.event)[0])
      }

      res.sendStatus(404)
    })
  )
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  translations: { en, fr, es },
  definition: {
    name: 'extensions',
    menuIcon: 'none',
    menuText: 'Extensions',
    noInterface: true,
    fullName: 'Extensions',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint

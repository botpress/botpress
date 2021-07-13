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

  router.get(
    '/message-to-event/:messageId',
    asyncMiddleware(async (req, res) => {
      const [messageEvent] = await bp.events.findEvents({
        messageId: req.params.messageId,
        botId: req.params.botId
      })

      if (!messageEvent) {
        return res.sendStatus(404)
      }

      const [incomingEvent] = await bp.events.findEvents({
        incomingEventId: messageEvent.incomingEventId,
        direction: 'incoming',
        botId: req.params.botId
      })

      if (!incomingEvent) {
        return res.sendStatus(404)
      }

      return res.send(incomingEvent.event)
    })
  )

  router.get(
    '/list-by-incoming-event/:messageId',
    asyncMiddleware(async (req, res) => {
      const { messageId, botId } = req.params

      const [messageEvent] = await loadEvents({ messageId, botId })

      if (!messageEvent) {
        return res.sendStatus(404)
      }

      const messages = await loadEvents({
        incomingEventId: messageEvent.incomingEventId,
        botId
      })

      if (!messages) {
        return res.sendStatus(404)
      }

      const messageIds = messages.map(m => m.messageId)

      return res.send(messageIds)
    })
  )

  const loadEvents = async (fields: Partial<sdk.IO.StoredEvent>) => {
    const DELAY_BETWEEN_CALLS = 500
    const allowedRetryCount = 6
    let currentRetryCount = 0
    let keepRetrying = false

    try {
      return bp.events.findEvents(fields)
    } catch (err) {
      keepRetrying = true
    }

    if (keepRetrying) {
      if (currentRetryCount < allowedRetryCount) {
        currentRetryCount++

        await Promise.delay(DELAY_BETWEEN_CALLS)
        await loadEvents(fields)
      } else {
        currentRetryCount = 0
      }
    } else {
      currentRetryCount = 0
    }
  }
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  translations: { en, fr, es },
  definition: {
    name: 'extensions',
    menuText: 'Extensions',
    noInterface: true,
    fullName: 'Extensions',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint

import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw } from 'common/http'
import _ from 'lodash'

import en from '../translations/en.json'
import fr from '../translations/fr.json'

const MIDDLEWARE_NAME = 'extensions.sendMessage'
type Events = { [target: string]: sdk.IO.OutgoingEvent }
const events: Events = {}

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

  await setupMiddleware(bp)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  await removeMiddleware(bp)
}

async function setupMiddleware(bp: typeof sdk) {
  bp.events.registerMiddleware({
    description: 'Extends outgoing messages',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: MIDDLEWARE_NAME,
    order: 10
  })

  async function outgoingHandler(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    const logger = bp.logger.forBot(event.botId)
    // logger.info(`outgoingHandler: ${JSON.stringify(event)}`)

    if (event.payload && event.payload.options) {
      events[event.target] = event
    }

    return next()
  }

  bp.events.registerMiddleware({
    description: 'Extends incoming messages',
    direction: 'incoming',
    handler: incomingHandler,
    name: MIDDLEWARE_NAME,
    order: 0
  })

  function normalize(str: string) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/ \(|,/)[0]
  }

  async function incomingHandler(event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) {
    const logger = bp.logger.forBot(event.botId)
    const outgoingEvent = events[event.target]

    // logger.info(`incomingHandler: \nevent=${JSON.stringify(event)} \noutgoingEvent=${JSON.stringify(outgoingEvent)}`)

    if (outgoingEvent) {
      delete events[event.target]
      const options = outgoingEvent.payload.options
      const text = event.payload.text
      // logger.info('options:', options, event.payload)

      const option = _.filter(
        options,
        option => normalize(option.label) == normalize(text) || option.value.toLowerCase() == text.toLowerCase()
      )

      logger.info(`option: ${JSON.stringify(option)}`)

      event.state.temp = _.assign(event.state.temp || {}, { 'dropdown-valid': true })

      event.setFlag(bp.IO.WellKnownFlags.FORCE_PERSIST_STATE, true)

      if (option.length) {
        event.payload.text = option[0].label
        event.payload.payload = option[0].value
      } else {
        delete event.payload.text

        event.payload.invalid = text
        event.state.temp['dropdown-valid'] = false

        return next(new Error(`Invalid value: ${text}`))
      }
    }

    return next()
  }
}

async function removeMiddleware(bp: typeof sdk) {
  bp.events.removeMiddleware(MIDDLEWARE_NAME)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onModuleUnmount,
  translations: { en, fr },
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

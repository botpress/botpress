import retry from 'bluebird-retry'
import moment from 'moment'

import Storage from './storage'
import Parser from './parser'

import DialogflowProvider from './providers/dialogflow'
import LuisProvider from './providers/luis'
import RasaProvider from './providers/rasa'
import RecastProvider from './providers/recast'
import NativeProvider from './providers/native'

let storage
let provider

module.exports = {
  config: {
    intentsDir: { type: 'string', required: true, default: './intents', env: 'NLU_INTENTS_DIR' },
    entitiesDir: { type: 'string', required: true, default: './entities', env: 'NLU_ENTITIES_DIR' },

    // Provider config
    provider: { type: 'string', required: true, default: 'native', env: 'NLU_PROVIDER' },

    // DIALOGFLOW-specific config
    googleProjectId: { type: 'string', required: false, default: '', env: 'NLU_GOOGLE_PROJECT_ID' },

    // LUIS-specific config
    luisAppId: { type: 'string', required: false, default: '', env: 'NLU_LUIS_APP_ID' },
    luisProgrammaticKey: { type: 'string', required: false, default: '', env: 'NLU_LUIS_PROGRAMMATIC_KEY' },
    luisAppSecret: { type: 'string', required: false, default: '', env: 'NLU_LUIS_APP_SECRET' },
    luisAppRegion: { type: 'string', required: false, default: 'westus', env: 'NLU_LUIS_APP_REGION' },

    // RASA-specific config
    rasaEndpoint: { type: 'string', required: false, default: 'http://localhost:5000', env: 'NLU_RASA_URL' },
    rasaToken: { type: 'string', required: false, default: '', env: 'NLU_RASA_TOKEN' },
    rasaProject: { type: 'string', required: false, default: 'botpress', env: 'NLU_RASA_PROJECT' },

    // RECAST-specific config
    recastToken: { type: 'string', required: false, default: '', env: 'NLU_RECAST_TOKEN' },
    recastUserSlug: { type: 'string', required: false, default: '', env: 'NLU_RECAST_USER_SLUG' },
    recastBotSlug: { type: 'string', required: false, default: '', env: 'NLU_RECAST_BOT_SLUG' },

    // Debug mode will print NLU information to the console for debugging purposes
    debugModeEnabled: { type: 'bool', required: true, default: false, env: 'NLU_DEBUG_ENABLED' },

    // The minimum confidence required (in %) for an intent to match
    // Set to '0' to always match
    minimumConfidence: { type: 'string', required: false, default: '0.3', env: 'NLU_MIN_CONFIDENCE' },

    // The maximum confidence after which it is considered a statistical error
    // Mostly irrelevant except for NLU=native
    maximumConfidence: { type: 'string', required: false, default: '1000', env: 'NLU_MAX_CONFIDENCE' },

    // The minimum difference between scores required before we apply a distribution fixes
    nativeAdjustementThreshold: { type: 'string', required: false, default: '0.25', env: 'NLU_NATIVE_ADJ_THRESHOLD' },
    // The maximum number of requests per hour
    // Useful to make sure you don't overuse your budget on paid NLU-services (like LUIS)
    maximumRequestsPerHour: { type: 'string', required: false, default: '1000', env: 'NLU_MAX_REQUESTS_PER_HOUR' }
  },

  init: async function(bp, configurator) {
    const config = await configurator.loadAll()
    storage = new Storage({ bp, config })
    await storage.initializeGhost()

    const Provider = {
      dialogflow: DialogflowProvider,
      luis: LuisProvider,
      rasa: RasaProvider,
      recast: RecastProvider,
      native: NativeProvider
    }[config.provider.toLowerCase()]

    if (!Provider) {
      throw new Error(`Unknown NLU provider "${config.provider}"`)
    }

    let MIN_CONFIDENCE = parseFloat(config.minimumConfidence)

    if (isNaN(MIN_CONFIDENCE) || MIN_CONFIDENCE < 0 || MIN_CONFIDENCE > 1) {
      MIN_CONFIDENCE = 0
    }

    let MAX_CONFIDENCE = parseFloat(config.maximumConfidence)

    if (isNaN(MAX_CONFIDENCE) || MAX_CONFIDENCE < 0) {
      MAX_CONFIDENCE = 10000
    }

    provider = new Provider({
      logger: bp.logger,
      storage,
      parser: new Parser(),
      kvs: bp.kvs,
      config
    })
    await provider.init()

    const retryPolicy = {
      interval: 100,
      max_interval: 500,
      timeout: 5000,
      max_tries: 3
    }

    async function processEvent(event) {
      if (['session_reset', 'bp_dialog_timeout'].includes(event.type)) {
        return
      }

      const previous = JSON.parse((await bp.kvs.get('nlu/requestsLimit')) || '{}')
      const hour = moment().startOf('hour')
      const requestsCount = hour.isSame(previous.hour) ? previous.requestsCount : 0

      await bp.kvs.set('nlu/requestsLimit', JSON.stringify({ hour, requestsCount: requestsCount + 1 }))

      const maximumRequestsPerHour = parseFloat(config.maximumRequestsPerHour)
      if (requestsCount > maximumRequestsPerHour) {
        throw new Error(
          `[NLU] Requests limit per hour exceeded: ${maximumRequestsPerHour} allowed ` +
            `while getting ${requestsCount}. You can set higher value to NLU_MAX_REQUESTS_PER_HOUR.`
        )
      }

      let eventIntent = {}
      let eventIntents = []

      try {
        if (config.debugModeEnabled) {
          bp.logger.info('[NLU Extraction] ' + event.text, event.raw)
        }

        const metadata = await retry(() => provider.extract(event), retryPolicy)

        if (metadata) {
          Object.assign(event, { nlu: metadata })
          eventIntent = metadata.intent
          eventIntents = metadata.intents
        }
      } catch (err) {
        bp.logger.warn('[NLU] Error extracting metadata for incoming text: ' + err.message)
      }

      const intentConfidentEnough = () => {
        const confidence = eventIntent.confidence != null ? eventIntent.confidence : 1
        return confidence >= MIN_CONFIDENCE && confidence <= MAX_CONFIDENCE
      }

      if (event.nlu) {
        Object.assign(event.nlu.intent, {
          intentConfidentEnough,
          is: intentName => {
            intentName = (intentName || '').toLowerCase()
            return intentConfidentEnough() && (eventIntent.name || '').toLowerCase() === intentName
          },
          startsWith: prefix => {
            prefix = (prefix || '').toLowerCase()
            return intentConfidentEnough() && (eventIntent.name || '').toLowerCase().startsWith(prefix)
          }
        })
        Object.assign(event.nlu.intents, {
          has: intentName => {
            intentName = (intentName || '').toLowerCase()
            return !!eventIntents.find(intent => (intent.name || '').toLowerCase() === intentName)
          }
        })
      }
    }

    bp.nlu = {
      processEvent,
      provider,
      storage
    }

    bp.middlewares.register({
      name: 'nlu.incoming',
      module: 'botpress-nlu',
      type: 'incoming',
      handler: async (event, next) => {
        await processEvent(event)
        next()
      },
      order: 10,
      description:
        'Process natural language in the form of text. Structured data with an action and parameters for that action is injected in the incoming message event.'
    })
  },

  ready: async function(bp) {
    const router = bp.getRouter('botpress-nlu')

    router.delete('/intents/:intent', async (req, res) => {
      await storage.deleteIntent(req.params.intent)
      res.sendStatus(200)
    })

    router.post('/intents/:intent', async (req, res) => {
      await storage.saveIntent(req.params.intent, req.body)
      res.sendStatus(200)
    })

    router.get('/intents', async (req, res) => {
      res.send(await storage.getIntents())
    })

    router.get('/intents/:intent', async (req, res) => {
      res.send(await storage.getIntent(req.params.intent))
    })

    router.get('/entities', async (req, res) => {
      res.send((await provider.getAvailableEntities()).map(x => x.name))
    })

    router.get('/sync/check', async (req, res) => {
      res.send(await provider.checkSyncNeeded())
    })

    router.get('/sync', async (req, res) => {
      try {
        await provider.sync()
        res.sendStatus(200)
      } catch (e) {
        res.status(500).send(`${e.name} : ${e.message}`)
      }
    })
  }
}

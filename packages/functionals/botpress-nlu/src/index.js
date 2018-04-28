import _ from 'lodash'
import retry from 'bluebird-retry'

import Storage from './storage'
import Parser from './parser'

import Entities from './providers/entities'

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
    debugModeEnabled: { type: 'bool', required: true, default: false, env: 'NLU_DEBUG_ENABLED' }
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

    provider = new Provider({
      logger: bp.logger,
      storage: storage,
      parser: new Parser(),
      kvs: bp.db.kvs,
      config: config
    })
    await provider.init()

    const retryPolicy = {
      interval: 100,
      max_interval: 500,
      timeout: 5000,
      max_tries: 3
    }

    async function incomingMiddleware(event, next) {
      if (['session_reset', 'bp_dialog_timeout'].includes(event.type)) return next()

      try {
        if (config.debugModeEnabled) {
          bp.logger.info('[NLU Extraction] ' + event.text, event.raw)
        }

        const metadata = await retry(() => provider.extract(event), retryPolicy)
        if (metadata) {
          Object.assign(event, { nlu: metadata })
        }
      } catch (err) {
        bp.logger.warn('[NLU] Error extracting metadata for incoming text: ' + err.message)
      }

      _.merge(event, {
        nlu: {
          intent: {
            is: intentName =>
              (_.get(event, 'nlu.intent.name') || '').toLowerCase() === (intentName && intentName.toLowerCase())
          },
          intents: {
            has: intentName => !!(_.get(event, 'nlu.intents') || []).find(i => i.name === intentName)
          }
        }
      })
      next()
    }

    bp.middlewares.register({
      name: 'nlu.incoming',
      module: 'botpress-nlu',
      type: 'incoming',
      handler: incomingMiddleware,
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
      await storage.saveIntent(req.params.intent, req.body && req.body)
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

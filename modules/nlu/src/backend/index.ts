import 'bluebird-global'
import retry from 'bluebird-retry'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import moment from 'moment'
import path from 'path'

import api from './api'
import ScopedNlu from './scopednlu'

export type Extension = {
  nlu: {
    processEvent: Function // (event: sdk.IO.Event) =>
    forBot: (botId: string) => ScopedNlu
  }
}

export type SDK = typeof sdk & Extension

const scopedNlus: Map<string, ScopedNlu> = new Map<string, ScopedNlu>()

export const onInit = async (bp: SDK) => {
  const bots = await bp.bots.getAllBots()

  for (const [id] of bots) {
    // if (!bot.isMiddlewareEnabled('nlu')) {
    //  return
    // }

    const scoped = new ScopedNlu(bp, id)
    await scoped.initialize()

    scopedNlus.set(id, scoped)
  }

  function forBot(botId): ScopedNlu {
    return scopedNlus.get(botId)
  }

  async function processEvent(event) {
    if (['session_reset', 'bp_dialog_timeout'].includes(event.type)) {
      return
    }

    const botCtx = forBot(event.botId)
    if (!botCtx) {
      return
    }

    // TODO when kvs is ready
    /*const previous = JSON.parse((await bp.kvs.get('nlu/requestsLimit')) || '{}')
    const hour = moment().startOf('hour')
    const requestsCount = hour.isSame(previous.hour) ? previous.requestsCount : 0

    await bp.kvs.set('nlu/requestsLimit', JSON.stringify({ hour, requestsCount: requestsCount + 1 }))

    const maximumRequestsPerHour = parseFloat(botCtx.config.maximumRequestsPerHour)
    if (requestsCount > maximumRequestsPerHour) {
      throw new Error(
        `[NLU] Requests limit per hour exceeded: ${maximumRequestsPerHour} allowed ` +
          `while getting ${requestsCount}. You can set higher value to NLU_MAX_REQUESTS_PER_HOUR.`
      )
    }*/

    let eventIntent = { confidence: undefined, name: undefined }
    let eventIntents = []

    try {
      if (botCtx.config.debugModeEnabled) {
        bp.logger.info('[NLU Extraction] ' + event.text, event.raw)
      }

      const metadata = await retry(() => botCtx.provider.extract(event), botCtx.retryPolicy)

      if (metadata) {
        Object.assign(event, { nlu: metadata })
        eventIntent = metadata.intent
        eventIntents = metadata.intents
      }
    } catch (err) {
      bp.logger.warn('[NLU] Error extracting metadata for incoming text: ' + err.message)
    }

    const intentConfidentEnough = () => {
      const confidence = eventIntent.confidence != undefined ? eventIntent.confidence : 1
      return confidence >= botCtx.minConfidence && confidence <= botCtx.maxConfidence
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
    forBot
  }

  bp.events.registerMiddleware({
    name: 'nlu.incoming',
    direction: 'incoming',
    handler: async (event, next) => {
      await processEvent(event)
      next()
    },
    order: 10,
    description:
      'Process natural language in the form of text. Structured data with an action and parameters for that action is injected in the incoming message event.',
    enabled: true
  })
}

export const onReady = async bp => {
  await api(bp)
}

export const serveFile = async (filePath: string): Promise<Buffer> => {
  filePath = filePath.toLowerCase()

  const mapping = {
    'index.js': path.join(__dirname, '../web/web.bundle.js')
    // 'embedded.js': path.join(__dirname, '../web/embedded.bundle.js'),
    // 'fullscreen.js': path.join(__dirname, '../web/fullscreen.bundle.js')
  }

  // Web views
  if (mapping[filePath]) {
    return fs.readFileSync(mapping[filePath])
  }

  return new Buffer('')
}

export const config = {
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
}

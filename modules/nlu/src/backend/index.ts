import 'bluebird-global'

import * as sdk from 'botpress/sdk'
import fs from 'fs'
import path from 'path'

import api from './api'
import FTWrapper from './fasttext/fasttext.wrapper'
import ScopedNlu from './scopednlu'
import { initBot, initModule } from './setup'

export type SDK = typeof sdk

const botScopedNlu: Map<string, ScopedNlu> = new Map<string, ScopedNlu>()

const onServerStarted = async (bp: SDK) => {
  await initModule(bp, botScopedNlu)

  const config = await bp.config.getModuleConfig('nlu')
  if (config.fastTextPath) {
    FTWrapper.changeBinPath(config.fastTextPath)
  }
}

const onServerReady = async (bp: SDK) => {
  await api(bp, botScopedNlu)
}

const onBotMount = async (bp: SDK, botId: string) => {
  await initBot(bp, botScopedNlu, botId)
}

const onBotUnmount = async (bp: SDK, botId: string) => {
  botScopedNlu.delete(botId)
}

const serveFile = async (filePath: string): Promise<Buffer> => {
  filePath = filePath.toLowerCase()

  const mapping = {
    'index.js': path.join(__dirname, '../web/web.bundle.js')
  }

  // Web views
  if (mapping[filePath]) {
    return fs.readFileSync(mapping[filePath])
  }

  return Buffer.from('')
}

const defaultConfigJson = `
{
  "intentsDir": "./intents",
  "entitiesDir": "./entities",
  "modelsDir": "./models",
  "provider": "native",
  "debugModeEnabled": true,
  "minimumConfidence": "0.3"
}
`

const config: sdk.ModuleConfig = {
  intentsDir: { type: 'string', required: true, default: './intents', env: 'NLU_INTENTS_DIR' },
  entitiesDir: { type: 'string', required: true, default: './entities', env: 'NLU_ENTITIES_DIR' },
  modelsDir: { type: 'string', required: true, default: './models', env: 'NLU_MODELS_DIR' },
  fastTextPath: { type: 'string', required: false, default: '', env: 'NLU_FASTTEXT_PATH' },

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

  // The maximum number of requests per hour
  // Useful to make sure you don't overuse your budget on paid NLU-services (like LUIS)
  maximumRequestsPerHour: { type: 'string', required: false, default: '1000', env: 'NLU_MAX_REQUESTS_PER_HOUR' }
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  config,
  defaultConfigJson,
  serveFile,
  definition: {
    name: 'nlu',
    moduleView: {
      stretched: true
    },
    menuIcon: 'fiber_smart_record',
    menuText: 'NLU',
    fullName: 'NLU',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint

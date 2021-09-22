import * as sdk from 'botpress/sdk'
import { BotpressConfig, NLUConfig as NLUCoreConfig } from 'core/config'
import { Migration, MigrationOpts } from 'core/migration'
import _ from 'lodash'

interface LanguageSource {
  endpoint: string
  authToken?: string
}

type StanConfig = { autoStart: true } | ({ autoStart: false } & LanguageSource)
interface NLUModConfig {
  nluServer: StanConfig
  ducklingURL: string
  ducklingEnabled: boolean
  languageSources: LanguageSource[]
  modelCacheSize: string
  maxTrainingPerInstance?: number
  queueTrainingOnBotMount?: boolean
  legacyElection: boolean
}

type PreviousBotpressConfig = Omit<BotpressConfig, 'nlu'> & { nlu?: undefined }

const DEFAULT_NLU_CONFIG: NLUCoreConfig = {
  // queueTrainingOnBotMount: undefined,
  // legacyElection: undefined,
  // modelCacheSize: undefined,
  // maxTrainingPerInstance: undefined,
  autoStartNLUServer: true,
  nluServerEndpoint: '',
  ducklingEnabled: true,
  ducklingURL: 'https://duckling.botpress.io',
  languageSources: [{ endpoint: 'https://lang-01.botpress.io' }]
}

const getNLUServerConfig = (config: StanConfig) => {
  if (config.autoStart) {
    return {
      autoStartNLUServer: true,
      nluServerEndpoint: ''
    }
  }
  const { endpoint } = config
  return {
    autoStartNLUServer: false,
    nluServerEndpoint: endpoint
  }
}

const mapModConfigToCore = (modConfig: NLUModConfig): NLUCoreConfig => {
  const {
    ducklingEnabled,
    ducklingURL,
    languageSources,
    modelCacheSize,
    maxTrainingPerInstance,
    queueTrainingOnBotMount,
    legacyElection,
    nluServer
  } = modConfig
  const { autoStartNLUServer, nluServerEndpoint } = getNLUServerConfig(nluServer)
  return {
    autoStartNLUServer,
    nluServerEndpoint,
    legacyElection,
    queueTrainingOnBotMount,
    maxTrainingPerInstance,
    modelCacheSize,
    languageSources,
    ducklingURL,
    ducklingEnabled
  }
}

const mapCoreConfigToMod = (coreConfig: NLUCoreConfig): NLUModConfig => {
  const {
    ducklingEnabled,
    ducklingURL,
    languageSources,
    modelCacheSize,
    maxTrainingPerInstance,
    queueTrainingOnBotMount,
    legacyElection,
    autoStartNLUServer,
    nluServerEndpoint
  } = coreConfig

  let nluServer: StanConfig
  if (autoStartNLUServer) {
    nluServer = { autoStart: true }
  } else {
    nluServer = { autoStart: false, endpoint: nluServerEndpoint }
  }

  return {
    nluServer,
    legacyElection: legacyElection ?? false,
    queueTrainingOnBotMount,
    maxTrainingPerInstance,
    modelCacheSize: modelCacheSize ?? '850mb',
    languageSources,
    ducklingURL,
    ducklingEnabled
  }
}

const migration: Migration = {
  info: {
    description: '',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      const ghost = bp.ghost.forGlobal()

      const nluJsonExists = await ghost.fileExists('./config', 'nlu.json')

      let nluCoreConfig: NLUCoreConfig
      if (!nluJsonExists) {
        nluCoreConfig = DEFAULT_NLU_CONFIG
      } else {
        const nluModConfig = await ghost.readFileAsObject<NLUModConfig>('config', 'nlu.json')
        await ghost.deleteFile('config', 'nlu.json')
        nluCoreConfig = mapModConfigToCore(nluModConfig)
      }

      const currentBotpressConfig = await ghost.readFileAsObject<BotpressConfig>('.', 'botpress.config.json')
      const updatedConfig: BotpressConfig = { ...currentBotpressConfig, nlu: nluCoreConfig }
      await ghost.upsertFile('.', 'botpress.config.json', JSON.stringify(updatedConfig, null, 2))
      return { success: true, message: 'Migration ran successfully' }
    } catch (err) {
      return { success: false, message: `The following error occured when running the migration ${err.message}.` }
    }
  },
  down: async ({ bp, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      const ghost = bp.ghost.forGlobal()

      const currentBotpressConfig = await ghost.readFileAsObject<BotpressConfig>('.', 'botpress.config.json')
      const { nlu: coreNluConfig } = currentBotpressConfig
      const modNluConfig = mapCoreConfigToMod(coreNluConfig)

      await ghost.upsertFile('config', 'nlu.json', JSON.stringify(modNluConfig, null, 2))

      const updatedConfig: PreviousBotpressConfig = { ...currentBotpressConfig, nlu: undefined }
      delete updatedConfig.nlu

      await ghost.upsertFile('.', 'botpress.config.json', JSON.stringify(updatedConfig, null, 2))
      return { success: true, message: 'Migration ran successfully' }
    } catch (err) {
      return { success: false, message: `The following error occured when running the migration ${err.message}.` }
    }
  }
}

export default migration

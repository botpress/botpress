import * as sdk from 'botpress/sdk'
import { BotpressConfig, NLUConfig as NLUCoreConfig } from 'core/config'
import { Migration, MigrationOpts } from 'core/migration'
import _ from 'lodash'

interface LanguageSource {
  endpoint: string
  authToken?: string
}

interface NLUModConfig {
  nluServer: { autoStart: true } | ({ autoStart: false } & LanguageSource)
  ducklingURL: string
  ducklingEnabled: boolean
  languageSources: LanguageSource[]
  modelCacheSize: string
  maxTrainingPerInstance?: number
  queueTrainingOnBotMount?: boolean
  legacyElection: boolean
}

type PreviousBotpressConfig = Omit<BotpressConfig, 'nlu'> & { nlu?: undefined }

const DEFAULT_NLU_CORE_CONFIG: NLUCoreConfig = {
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

const DEFAULT_NLU_MOD_CONFIG: NLUModConfig = {
  nluServer: { autoStart: true },
  queueTrainingOnBotMount: false,
  legacyElection: false,
  modelCacheSize: '850mb',
  maxTrainingPerInstance: 2,
  ducklingEnabled: true,
  ducklingURL: 'https://duckling.botpress.io',
  languageSources: [{ endpoint: 'https://lang-01.botpress.io' }]
}

const mapModConfigToCore = (modConfig: Partial<NLUModConfig>): Partial<NLUCoreConfig> => {
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

  let autoStartNLUServer: boolean | undefined
  let nluServerEndpoint: string | undefined
  if (nluServer && nluServer.autoStart) {
    autoStartNLUServer = true
  } else if (nluServer && !nluServer.autoStart) {
    autoStartNLUServer = false
    nluServerEndpoint = nluServer.endpoint
  }

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

const mapCoreConfigToMod = (coreConfig: Partial<NLUCoreConfig>): Partial<NLUModConfig> => {
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

  let nluServer: { autoStart: true } | ({ autoStart: false } & LanguageSource) | undefined
  if (autoStartNLUServer) {
    nluServer = { autoStart: true }
  } else if (nluServerEndpoint) {
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
  up: async ({ bp, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      const ghost = bp.ghost.forGlobal()

      const nluJsonExists = await ghost.fileExists('config', 'nlu.json')

      let nluCoreConfig: NLUCoreConfig
      if (!nluJsonExists) {
        nluCoreConfig = DEFAULT_NLU_CORE_CONFIG
      } else {
        const nluModConfig = await ghost.readFileAsObject<NLUModConfig>('config', 'nlu.json')
        await ghost.deleteFile('config', 'nlu.json')
        nluCoreConfig = { ...DEFAULT_NLU_CORE_CONFIG, ...mapModConfigToCore(nluModConfig) }
      }

      await configProvider.mergeBotpressConfig({ nlu: nluCoreConfig })
      return { success: true, message: 'Migration ran successfully' }
    } catch (err) {
      return { success: false, message: `The following error occured when running the migration ${err.message}.` }
    }
  },
  down: async ({ bp }: MigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      const ghost = bp.ghost.forGlobal()

      const currentBotpressConfig = await ghost.readFileAsObject<BotpressConfig>('.', 'botpress.config.json')
      const { nlu: coreNluConfig } = currentBotpressConfig
      const modNluConfig = { ...DEFAULT_NLU_MOD_CONFIG, ...mapCoreConfigToMod(coreNluConfig) }

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

import * as sdk from 'botpress/sdk'
import { BotpressConfig } from 'core/config'
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

type NLUCoreConfig = BotpressConfig['nlu']

type PreviousBotpressConfig = Omit<BotpressConfig, 'nlu'> & { nlu?: undefined }

const DEFAULT_NLU_CORE_CONFIG: NLUCoreConfig = {
  queueTrainingOnBotMount: false,
  nluServer: {
    modelCacheSize: '850mb',
    maxTraining: 2,
    ducklingEnabled: true,
    ducklingURL: 'https://duckling.botpress.io',
    languageSources: [{ endpoint: 'https://lang-01.botpress.io' }]
  }
}

const mapModConfigToCore = (modConfig: NLUModConfig): NLUCoreConfig => {
  const {
    ducklingEnabled,
    ducklingURL,
    languageSources,
    modelCacheSize,
    maxTrainingPerInstance,
    queueTrainingOnBotMount
  } = modConfig

  return {
    queueTrainingOnBotMount,
    nluServer: {
      maxTraining: maxTrainingPerInstance,
      modelCacheSize,
      languageSources,
      ducklingURL,
      ducklingEnabled
    }
  }
}

const mapCoreConfigToMod = (coreConfig: NLUCoreConfig): NLUModConfig => {
  const { queueTrainingOnBotMount, nluServer } = coreConfig

  const { ducklingEnabled, ducklingURL, languageSources, modelCacheSize, maxTraining } = nluServer

  return {
    nluServer: {
      autoStart: true
    },
    legacyElection: false,
    queueTrainingOnBotMount,
    maxTrainingPerInstance: maxTraining,
    modelCacheSize,
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

      const botpressConfig = await configProvider.getBotpressConfig()
      if (!!botpressConfig.nlu) {
        nluJsonExists && (await ghost.deleteFile('config', 'nlu.json'))
        return { success: true, message: 'Migration not needed.' }
      }

      let nluCoreConfig: NLUCoreConfig
      if (!nluJsonExists) {
        nluCoreConfig = DEFAULT_NLU_CORE_CONFIG
      } else {
        const nluModConfig = await ghost.readFileAsObject<NLUModConfig>('config', 'nlu.json')
        await ghost.deleteFile('config', 'nlu.json')
        nluCoreConfig = mapModConfigToCore(nluModConfig)
      }

      await configProvider.mergeBotpressConfig({ nlu: nluCoreConfig })
      return { success: true, message: 'Migration ran successfully' }
    } catch (err) {
      return { success: false, message: `The following error occured when running the migration ${err.message}.` }
    }
  },
  down: async ({ bp, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      const ghost = bp.ghost.forGlobal()

      const currentBotpressConfig = await configProvider.getBotpressConfig()
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

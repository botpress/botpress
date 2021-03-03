import Engine from './engine'
import { DUCKLING_ENTITIES } from './engine/entities/duckling-extractor/enums'
import { isTrainingAlreadyStarted, isTrainingCanceled } from './errors'
import modelIdService from './model-id-service'
import * as sdk from './nlu-core'

const nluCore: typeof sdk = {
  SYSTEM_ENTITIES: DUCKLING_ENTITIES,

  errors: {
    isTrainingAlreadyStarted,
    isTrainingCanceled
  },

  makeEngine: async (config: sdk.Config, logger: sdk.Logger) => {
    const { ducklingEnabled, ducklingURL, languageSources, modelCacheSize } = config
    const langConfig = { ducklingEnabled, ducklingURL, languageSources }
    const engine = new Engine({ maxCacheSize: modelCacheSize })
    await engine.initialize(langConfig, logger)
    return engine
  },

  modelIdService
}
export default nluCore

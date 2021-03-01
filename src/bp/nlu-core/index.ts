import * as NLU from 'botpress/nlu'
import Engine from './engine'
import { isTrainingAlreadyStarted, isTrainingCanceled } from './errors'
import modelIdService from './model-id-service'

const nluCore: typeof NLU = {
  makeEngine: async (config: NLU.Config, logger: NLU.Logger) => {
    const { ducklingEnabled, ducklingURL, languageSources, modelCacheSize } = config
    const langConfig = { ducklingEnabled, ducklingURL, languageSources }
    const engine = new Engine({ maxCacheSize: modelCacheSize })
    await engine.initialize(langConfig, logger)
    return engine
  },
  errors: {
    isTrainingAlreadyStarted,
    isTrainingCanceled
  },
  modelIdService
}
export default nluCore

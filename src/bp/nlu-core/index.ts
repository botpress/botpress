import Engine from './engine'
import { DUCKLING_ENTITIES } from './engine/entities/duckling-extractor/enums'
import * as _errors from './errors'

import * as NLU from './typings'

export * from './typings'

export const SYSTEM_ENTITIES = DUCKLING_ENTITIES

export namespace errors {
  export const isTrainingAlreadyStarted = _errors.isTrainingAlreadyStarted
  export const isTrainingCanceled = _errors.isTrainingCanceled
}

export const makeEngine = async (config: NLU.Config, logger: NLU.Logger) => {
  const { ducklingEnabled, ducklingURL, languageSources, modelCacheSize } = config
  const langConfig = { ducklingEnabled, ducklingURL, languageSources }
  const engine = new Engine({ maxCacheSize: modelCacheSize })
  await engine.initialize(langConfig, logger)
  return engine
}

export { default as modelIdService } from './model-id-service'

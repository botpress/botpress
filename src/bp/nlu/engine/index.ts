import Engine from './engine'
import { DUCKLING_ENTITIES } from './engine/entities/duckling-extractor/enums'
import { isTrainingAlreadyStarted, isTrainingCanceled } from './errors'
import _modelIdService from './model-id-service'
import * as sdk from './typings'

export const SYSTEM_ENTITIES = DUCKLING_ENTITIES

export const errors = {
  isTrainingAlreadyStarted,
  isTrainingCanceled
}

export const makeEngine = async (config: sdk.Config, logger: sdk.Logger) => {
  const { ducklingEnabled, ducklingURL, languageSources, modelCacheSize } = config
  const langConfig = { ducklingEnabled, ducklingURL, languageSources }
  const engine = new Engine({ maxCacheSize: modelCacheSize })
  await engine.initialize(langConfig, logger)
  return engine
}

export const modelIdService = _modelIdService

const nluEngine: typeof sdk = {
  SYSTEM_ENTITIES,
  errors,
  makeEngine,
  modelIdService
}
export default nluEngine

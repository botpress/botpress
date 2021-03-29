import Engine from './engine'
import { DUCKLING_ENTITIES } from './engine/entities/duckling-extractor/enums'
import { isTrainingAlreadyStarted, isTrainingCanceled } from './errors'
import _modelIdService from './model-id-service'
import { Config, Logger } from './typings'

export * from './typings'

export const SYSTEM_ENTITIES = DUCKLING_ENTITIES

export const errors: Dic<(err: Error) => boolean> = {
  isTrainingAlreadyStarted,
  isTrainingCanceled
}

export const makeEngine = async (config: Config, logger: Logger) => {
  const { ducklingEnabled, ducklingURL, languageSources, modelCacheSize } = config
  const langConfig = { ducklingEnabled, ducklingURL, languageSources }
  const engine = new Engine({ cacheSize: modelCacheSize })
  await engine.initialize(langConfig, logger)
  return engine
}

export const modelIdService = _modelIdService

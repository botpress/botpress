import * as sdk from 'botpress/sdk'
import Engine from 'nlu-core/engine'

import ModelService from './model/model-service'
import TrainSessionService from './train-session-service'

export default class TrainService {
  constructor(
    private logger: sdk.Logger,
    private engine: Engine,
    private modelService: ModelService,
    private trainSessionService: TrainSessionService
  ) {}

  train = async (
    modelId: string,
    password: string,
    intents: sdk.NLU.IntentDefinition[],
    entities: sdk.NLU.EntityDefinition[],
    language: string,
    nluSeed: number
  ) => {
    try {
      this.logger.info(`[${modelId}] Training Started.`)

      const ts = this.trainSessionService.makeTrainingSession(modelId, password, language)
      this.trainSessionService.setTrainingSession(modelId, password, ts)

      const progressCallback = (progress: number) => {
        ts.progress = progress
        this.trainSessionService.setTrainingSession(modelId, password, ts)
      }

      const model = await this.engine.train(ts.key, intents, entities, language, {
        forceTrain: true,
        nluSeed,
        progressCallback
      })

      if (!model) {
        this.logger.info(`[${modelId}] Training Canceled.`)

        ts.status = 'canceled'
        this.trainSessionService.setTrainingSession(modelId, password, ts)
        this.trainSessionService.releaseTrainingSession(modelId, password)
        return
      }

      this.logger.info(`[${modelId}] Training Done.`)

      await this.modelService.saveModel(model, modelId, password)
      ts.status = 'done'
      this.trainSessionService.setTrainingSession(modelId, password, ts)
      this.trainSessionService.releaseTrainingSession(modelId, password)
    } catch (err) {
      this.logger.attachError(err).error('an error occured during training')
    }
  }
}

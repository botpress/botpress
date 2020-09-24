import * as sdk from 'botpress/sdk'
import Engine from 'nlu-core/engine'

import ModelService from './model-service'
import TrainSessionService from './train-session-service'

export default class TrainService {
  constructor(
    private logger: sdk.Logger,
    private engine: Engine,
    private modelService: ModelService,
    private trainSessionService: TrainSessionService
  ) {}

  train = async (
    modelFileName: string,
    intents: sdk.NLU.IntentDefinition[],
    entities: sdk.NLU.EntityDefinition[],
    language: string,
    nluSeed: number
  ) => {
    try {
      this.logger.info(`[${modelFileName}] Training Started.`)

      const ts = this.trainSessionService.makeTrainingSession(modelFileName, language)
      this.trainSessionService.setTrainingSession(modelFileName, ts)

      const progressCallback = (progress: number) => {
        ts.progress = progress
        this.trainSessionService.setTrainingSession(modelFileName, ts)
      }

      const model = await this.engine.train(ts.key, intents, entities, language, {
        forceTrain: true,
        nluSeed,
        progressCallback
      })

      if (!model) {
        this.logger.info(`[${modelFileName}] Training Canceled.`)

        ts.status = 'canceled'
        this.trainSessionService.setTrainingSession(modelFileName, ts)
        this.trainSessionService.releaseTrainingSession(modelFileName)
        return
      }

      this.logger.info(`[${modelFileName}] Training Done.`)

      await this.modelService.saveModel(model, modelFileName)
      ts.status = 'done'
      this.trainSessionService.setTrainingSession(modelFileName, ts)
      this.trainSessionService.releaseTrainingSession(modelFileName)
    } catch (err) {
      this.logger.attachError(err).error('an error occured during training')
    }
  }
}

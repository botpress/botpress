import * as sdk from 'botpress/sdk'
import Engine from 'nlu-core/engine'
import { isTrainingAlreadyStarted } from 'nlu-core/errors'
import { isTrainingCanceled } from 'nlu-core/training-worker-queue/communication'

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
    this.logger.info(`[${modelId}] Training Started.`)

    const ts = this.trainSessionService.makeTrainingSession(modelId, password, language)
    this.trainSessionService.setTrainingSession(modelId, password, ts)

    const progressCallback = (progress: number) => {
      ts.progress = progress
      this.trainSessionService.setTrainingSession(modelId, password, ts)
    }

    try {
      const model = await this.engine.train(ts.key, intents, entities, language, { nluSeed, progressCallback })
      this.logger.info(`[${modelId}] Training Done.`)

      await this.modelService.saveModel(model, modelId, password)
      ts.status = 'done'
      this.trainSessionService.setTrainingSession(modelId, password, ts)
      this.trainSessionService.releaseTrainingSession(modelId, password)
    } catch (err) {
      if (isTrainingCanceled(err)) {
        this.logger.info(`[${modelId}] Training Canceled.`)

        ts.status = 'canceled'
        this.trainSessionService.setTrainingSession(modelId, password, ts)
        this.trainSessionService.releaseTrainingSession(modelId, password)
        return
      }

      if (isTrainingAlreadyStarted(err)) {
        this.logger.error('training already started')
        return
      }

      ts.status = 'errored'
      this.trainSessionService.setTrainingSession(modelId, password, ts)
      this.trainSessionService.releaseTrainingSession(modelId, password)
      this.logger.attachError(err).error('an error occured during training')
      return
    }
  }
}

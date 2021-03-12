import * as sdk from 'botpress/sdk'

import nluEngine from 'nlu/engine'

import ModelRepository from './model-repo'
import TrainSessionService from './train-session-service'

export default class TrainService {
  constructor(
    private logger: sdk.Logger,
    private engine: nluEngine.Engine,
    private modelRepo: ModelRepository,
    private trainSessionService: TrainSessionService
  ) {}

  train = async (
    modelId: nluEngine.ModelId,
    password: string,
    intents: sdk.NLU.IntentDefinition[],
    entities: sdk.NLU.EntityDefinition[],
    language: string,
    nluSeed: number
  ) => {
    const stringId = nluEngine.modelIdService.toString(modelId)
    this.logger.info(`[${stringId}] Training Started.`)

    const ts = this.trainSessionService.makeTrainingSession(modelId, password, language)
    this.trainSessionService.setTrainingSession(modelId, password, ts)

    const progressCallback = (progress: number) => {
      if (ts.status === 'training-pending') {
        ts.status = 'training'
      }
      ts.progress = progress
      this.trainSessionService.setTrainingSession(modelId, password, ts)
    }

    try {
      const trainSet: nluEngine.TrainingSet = {
        intentDefs: intents,
        entityDefs: entities,
        languageCode: language,
        seed: nluSeed
      }
      const model = await this.engine.train(ts.key, trainSet, { progressCallback })
      this.logger.info(`[${stringId}] Training Done.`)

      await this.modelRepo.saveModel(model, password)
      ts.status = 'done'
      this.trainSessionService.setTrainingSession(modelId, password, ts)
      this.trainSessionService.releaseTrainingSession(modelId, password)
    } catch (err) {
      if (nluEngine.errors.isTrainingCanceled(err)) {
        this.logger.info(`[${stringId}] Training Canceled.`)

        ts.status = 'canceled'
        this.trainSessionService.setTrainingSession(modelId, password, ts)
        this.trainSessionService.releaseTrainingSession(modelId, password)
        return
      }

      if (nluEngine.errors.isTrainingAlreadyStarted(err)) {
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

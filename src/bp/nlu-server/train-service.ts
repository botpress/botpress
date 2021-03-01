import * as NLU from 'botpress/nlu'
import * as sdk from 'botpress/sdk'
import Engine from 'nlu-core/engine'
import { isTrainingAlreadyStarted, isTrainingCanceled } from 'nlu-core/errors'
import modelIdService from 'nlu-core/model-id-service'

import ModelRepository from './model-repo'
import TrainSessionService from './train-session-service'

export default class TrainService {
  constructor(
    private logger: sdk.Logger,
    private engine: Engine,
    private modelRepo: ModelRepository,
    private trainSessionService: TrainSessionService
  ) {}

  train = async (
    modelId: NLU.ModelId,
    password: string,
    intents: sdk.NLU.IntentDefinition[],
    entities: sdk.NLU.EntityDefinition[],
    language: string,
    nluSeed: number
  ) => {
    const stringId = modelIdService.toString(modelId)
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
      const trainSet: NLU.TrainingSet = {
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
      if (isTrainingCanceled(err)) {
        this.logger.info(`[${stringId}] Training Canceled.`)

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

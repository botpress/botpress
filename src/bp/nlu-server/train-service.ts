import { NLU } from 'botpress/sdk'
import Engine from 'nlu-core/engine'

import { NLUServerLogger } from './logger'
import ModelService from './model-service'
import TrainSessionService from './train-session-service'

export default class TrainService {
  constructor(
    private logger: NLUServerLogger,
    private engine: Engine,
    private modelService: ModelService,
    private trainSessionService: TrainSessionService
  ) {}

  train = async (
    modelId: string,
    password: string,
    intents: NLU.IntentDefinition[],
    entities: NLU.EntityDefinition[],
    language: string,
    seed?: number
  ) => {
    try {
      const ts = this.trainSessionService.makeTrainingSession(language)
      this.trainSessionService.setTrainingSession(modelId, ts)

      const progressCallback = (progress: number) => {
        ts.progress = progress
        this.trainSessionService.setTrainingSession(modelId, ts)
      }

      const model = await this.engine.train(intents, entities, language, ts, {
        forceTrain: true,
        seed,
        progressCallback
      })
      if (!model) {
        throw new Error('training could not finish')
      }
      await this.modelService.saveModel(model!, modelId, password)

      ts.status = 'done'
      this.trainSessionService.setTrainingSession(modelId, ts)
      setTimeout(() => this.trainSessionService.removeTrainingSession(modelId), 30000)
    } catch (err) {
      this.logger.attachError(err).error('an error occured during training')
    }
  }
}

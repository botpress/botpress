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
    modelFileName: string,
    intents: NLU.IntentDefinition[],
    entities: NLU.EntityDefinition[],
    language: string,
    nluSeed: number
  ) => {
    try {
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
        ts.status = 'canceled'
        this.trainSessionService.setTrainingSession(modelFileName, ts)
        setTimeout(() => this.trainSessionService.removeTrainingSession(modelFileName), 30000)
        return
      }

      await this.modelService.saveModel(model, modelFileName)
      ts.status = 'done'
      this.trainSessionService.setTrainingSession(modelFileName, ts)
      setTimeout(() => this.trainSessionService.removeTrainingSession(modelFileName), 30000)
    } catch (err) {
      this.logger.attachError(err).error('an error occured during training')
    }
  }
}

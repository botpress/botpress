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
    intents: NLU.IntentDefinition[],
    entities: NLU.EntityDefinition[],
    language: string
  ) => {
    try {
      const ts = this.trainSessionService.makeTrainingSession(language)
      await this.trainSessionService.setTrainingSession(modelId, ts)

      const reportTrainingProgress = async (_botId: string, message: string, trainSession: NLU.TrainingSession) => {
        await this.trainSessionService.setTrainingSession(modelId, trainSession)
        this.logger.info(message)
      }

      const model = await this.engine.train(intents, entities, language, reportTrainingProgress, ts, {
        forceTrain: true
      })
      if (!model) {
        throw new Error('training could not finish')
      }
      await this.modelService.saveModel(model!, modelId)
    } catch (err) {
      this.logger.attachError(err).error('an error occured during training')
    }
  }
}

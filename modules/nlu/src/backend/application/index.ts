import _ from 'lodash'
import yn from 'yn'

import { IStanEngine } from '../stan'
import { mapTrainSet } from '../stan/api-mapper'
import { IScopedServicesFactory, ScopedServices } from './bot-factory'
import { IBotService } from './bot-service'
import { BotNotMountedError } from './errors'
import { ITrainingQueue } from './training-queue'
import { ITrainingRepository } from './training-repo'
import { Predictor, BotConfig, TrainingState, TrainingId } from './typings'

export class NLUApplication {
  private _queueTrainingOnBotMount: boolean

  constructor(
    private _trainingQueue: ITrainingQueue,
    private _engine: IStanEngine,
    private _servicesFactory: IScopedServicesFactory,
    private _botService: IBotService,
    queueTrainingOnBotMount: boolean = true
  ) {
    this._queueTrainingOnBotMount = queueTrainingOnBotMount
  }

  public get trainRepository(): ITrainingRepository {
    return this._trainingQueue.repository
  }

  public async teardown() {
    for (const botId of this._botService.getIds()) {
      await this.unmountBot(botId)
    }
    return this._trainingQueue.teardown()
  }

  public async getHealth() {
    try {
      const { health } = await this._engine.getInfo()
      return health
    } catch (err) {
      return
    }
  }

  public async getTraining(botId: string, language: string): Promise<TrainingState> {
    return this._trainingQueue.getTraining({ botId, language })
  }

  async resumeTrainings(): Promise<void> {
    await this._trainingQueue.resume()
  }

  public hasBot(botId: string) {
    return !!this._botService.getBot(botId)
  }

  public getBot(botId: string): Predictor {
    const bot = this._botService.getBot(botId)
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    return bot
  }

  public async mountBot(botConfig: BotConfig) {
    const { id: botId, languages } = botConfig
    const { bot, defService } = await this._servicesFactory.makeBot(botConfig)
    this._botService.setBot(botId, bot)

    const needsTrainingCb = (t: TrainingId) => this._trainingQueue.needsTraining(t)
    const queueTrainingCb = (t: TrainingId) => this._trainingQueue.queueTraining(t)

    const needsTrainingHandler = this._makeDirtyModelHandler({ bot, defService }, needsTrainingCb)
    const queueTrainingHandler = this._makeDirtyModelHandler({ bot, defService }, queueTrainingCb)

    defService.listenForDirtyModels(needsTrainingHandler)

    const trainingEnabled = !yn(process.env.BP_NLU_DISABLE_TRAINING)
    const handler = this._queueTrainingOnBotMount && trainingEnabled ? queueTrainingHandler : needsTrainingHandler

    await Promise.each(languages, handler)
    await bot.mount()
  }

  private _makeDirtyModelHandler = (scoped: ScopedServices, cb: (t: TrainingId) => Promise<void>) => {
    const { bot, defService } = scoped
    const { id: botId } = bot

    return async (lang: string) => {
      const trainSet = await defService.getTrainSet(lang)
      const trainInput = mapTrainSet(trainSet)
      const { exists, modelId } = await bot.hasModelFor(trainInput)
      const trainId = { botId, language: lang }
      if (exists) {
        await this.trainRepository.inTransaction(trx => trx.delete(trainId))
        bot.setModel(lang, modelId)
        return
      }
      return cb(trainId)
    }
  }

  public async unmountBot(botId: string) {
    const bot = this._botService.getBot(botId)
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    await bot.unmount()
    await this._trainingQueue.cancelTrainings(botId) // TODO: fully remove training sessions
    this._botService.removeBot(botId)
  }

  public async queueTraining(botId: string, language: string) {
    const bot = this._botService.getBot(botId)
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    return this._trainingQueue.queueTraining({ botId, language })
  }

  public async cancelTraining(botId: string, language: string) {
    const bot = this._botService.getBot(botId)
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    return this._trainingQueue.cancelTraining({ botId, language })
  }
}

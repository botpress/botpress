import * as NLU from 'common/nlu/engine'
import _ from 'lodash'
import yn from 'yn'

import { IScopedServicesFactory } from './bot-factory'
import { IBotService } from './bot-service'
import { BotNotMountedError } from './errors'
import { ITrainingQueue } from './training-queue'
import { ITrainingRepository } from './training-repo'
import { Predictor, BotConfig, TrainingSession, TrainingState, TrainingId } from './typings'

export class NLUApplication {
  private _queueTrainingOnBotMount: boolean

  constructor(
    private _trainingQueue: ITrainingQueue,
    private _engine: NLU.Engine,
    private _servicesFactory: IScopedServicesFactory,
    private _botService: IBotService,
    queueTrainingOnBotMount: boolean = true
  ) {
    this._queueTrainingOnBotMount = queueTrainingOnBotMount
  }

  public get trainRepository(): ITrainingRepository {
    return this._trainingQueue.repository
  }

  public teardown = async () => {
    for (const botId of this._botService.getIds()) {
      await this.unmountBot(botId)
    }
    return this._trainingQueue.teardown()
  }

  public getHealth() {
    return this._engine.getHealth()
  }

  public async getTraining(botId: string, language: string): Promise<TrainingState> {
    return this._trainingQueue.getTraining({ botId, language })
  }

  async resumeTrainings(): Promise<void> {
    await this._trainingQueue.resume()
  }

  public hasBot = (botId: string) => {
    return !!this._botService.getBot(botId)
  }

  public getBot(botId: string): Predictor {
    const bot = this._botService.getBot(botId)
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    return bot
  }

  public mountBot = async (botConfig: BotConfig) => {
    const { id: botId, languages } = botConfig
    const { bot, defService, modelRepo } = await this._servicesFactory.makeBot(botConfig)
    this._botService.setBot(botId, bot)

    const makeDirtyModelHandler = (cb: (trainId: TrainingId) => Promise<void>) => async (language: string) => {
      const latestModelId = await defService.getLatestModelId(language)
      if (await modelRepo.hasModel(latestModelId)) {
        await bot.load(latestModelId)
        return
      }
      return cb({ botId, language })
    }

    const loadOrSetTrainingNeeded = makeDirtyModelHandler((trainId: TrainingId) =>
      this._trainingQueue.needsTraining(trainId)
    )
    defService.listenForDirtyModels(loadOrSetTrainingNeeded)

    const trainingEnabled = !yn(process.env.BP_NLU_DISABLE_TRAINING)
    const trainingHandler =
      this._queueTrainingOnBotMount && trainingEnabled
        ? (trainId: TrainingId) => this._trainingQueue.queueTraining(trainId)
        : (trainId: TrainingId) => this._trainingQueue.needsTraining(trainId)

    const loadModelOrQueue = makeDirtyModelHandler(trainingHandler)
    await Promise.each(languages, lang => loadModelOrQueue(lang))
    await bot.mount()
  }

  public unmountBot = async (botId: string) => {
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

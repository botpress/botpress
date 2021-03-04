import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import { IBotFactory } from './bot-factory'
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
    private _botFactory: IBotFactory,
    private _botService: IBotService,
    queueTrainingOnBotMount: boolean = true
  ) {
    this._queueTrainingOnBotMount = queueTrainingOnBotMount
  }

  public async initialize() {
    await this._trainingQueue.initialize()
  }

  public get repository(): ITrainingRepository {
    return this._trainingQueue.service.repository
  }

  public teardown = async () => {
    await this._trainingQueue.teardown()
    for (const botId of this._botService.getIds()) {
      await this.unmountBot(botId)
    }
  }

  public getHealth() {
    return this._engine.getHealth()
  }

  public async getTraining(botId: string, language: string): Promise<TrainingState> {
    return this._trainingQueue.getTraining({ botId, language })
  }

  async getAllTrainings(): Promise<TrainingSession[]> {
    return this._trainingQueue.getAllTrainings()
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
    const { bot, defService, modelRepo } = await this._botFactory.makeBot(botConfig)
    this._botService.setBot(botId, bot)

    const makeDirtyModelHandler = (cb: (trainId: TrainingId) => Promise<void>) => async (language: string) => {
      const latestModelId = await defService.getLatestModelId(language)
      if (await modelRepo.hasModel(latestModelId)) {
        await bot.load(latestModelId)
        return
      }
      return cb({ botId, language })
    }

    const loadOrSetTrainingNeeded = makeDirtyModelHandler(this._trainingQueue.needsTraining)
    defService.listenForDirtyModels(loadOrSetTrainingNeeded)

    const trainingHandler = this._queueTrainingOnBotMount
      ? this._trainingQueue.queueTraining
      : this._trainingQueue.needsTraining

    const loadModelOrQueue = makeDirtyModelHandler(trainingHandler)
    for (const language of languages) {
      await loadModelOrQueue(language)
    }
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

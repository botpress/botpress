import { NLU, BotConfig } from 'botpress/sdk'
import _ from 'lodash'

import { BotFactory } from './bot-factory'
import { BotNotMountedError } from './errors'
import { Predictor, TrainingQueue } from './typings'
import { BotService } from './bot-service'

export class NLUApplication {
  constructor(
    private _trainingQueue: TrainingQueue,
    private _engine: NLU.Engine,
    private _botFactory: BotFactory,
    private _botService: BotService
  ) {}

  public async initialize() {
    await this._trainingQueue.initialize()
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

  public async getTraining(botId: string, language: string): Promise<NLU.TrainingSession> {
    return this._trainingQueue.getTraining({ botId, language })
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
    const { id: botId } = botConfig
    const { bot, defService, modelRepo } = await this._botFactory.makeBot(botConfig)
    this._botService.setBot(botId, bot)

    await bot.mount()

    let botMounted = false
    const dirtyModelListener = async (language: string) => {
      const latestModelId = await defService.getLatestModelId(language)
      if (await modelRepo.hasModel(latestModelId)) {
        botMounted = true
        await bot.load(latestModelId)
        return
      }

      if (botMounted) {
        return this._trainingQueue.needsTraining({ botId, language })
      }
      botMounted = true
      return this._trainingQueue.queueTraining({ botId, language })
    }

    defService.listenForDirtyModels(dirtyModelListener)
    await defService.scanForDirtyModels()
  }

  public unmountBot = async (botId: string) => {
    const bot = this._botService.getBot(botId)
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    await bot.unmount()
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

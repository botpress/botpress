import _ from 'lodash'
import yn from 'yn'

import { IStanEngine } from '../stan'
import { BotFactory } from './bot-factory'
import { IBotService } from './bot-service'
import { BotNotMountedError } from './errors'
import { Predictor, BotConfig, TrainingState } from './typings'

export class NLUApplication {
  constructor(private _engine: IStanEngine, private _botFactory: BotFactory, private _botService: IBotService) {}

  public async teardown() {
    for (const botId of this._botService.getIds()) {
      await this.unmountBot(botId)
    }
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
    const bot = this._botService.getBot(botId)
    if (!bot) {
      throw new Error()
    }
    return bot.getTraining(language)
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
    const bot = await this._botFactory.makeBot(botConfig)
    this._botService.setBot(botId, bot)

    const trainingEnabled = !yn(process.env.BP_NLU_DISABLE_TRAINING)

    // TODO: implement mounting logic
    // await Promise.each(languages, handler)

    await bot.mount()
  }

  public async unmountBot(botId: string) {
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
    return bot.startTraining(language)
  }

  public async cancelTraining(botId: string, language: string) {
    const bot = this._botService.getBot(botId)
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    return bot.cancelTraining(language)
  }
}

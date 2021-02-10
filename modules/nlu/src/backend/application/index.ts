import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import { BotFactory } from './bot-factory'
import { BotNotMountedError } from './errors'
import { Bot } from './scoped/bot'
import { ScopedDefinitionsService } from './scoped/definitions-service'
import { ScopedModelRepository } from './scoped/infrastructure/model-repository'
import { Predictor, TrainingQueue } from './typings'

interface ScopedServices {
  bot: Bot
  defService: ScopedDefinitionsService
  modelRepo: ScopedModelRepository
}

export class NLUApplication {
  private _bots: _.Dictionary<ScopedServices> = {}

  constructor(private _trainingQueue: TrainingQueue, private _engine: NLU.Engine, private _botFactory: BotFactory) {}

  public async initialize() {
    await this._trainingQueue.initialize()
  }

  public teardown = async () => {
    await this._trainingQueue.teardown()

    for (const botId of Object.keys(this._bots)) {
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
    return !!this._bots[botId]
  }

  public getBot(botId: string): Predictor {
    const scoped = this._bots[botId]
    if (!scoped) {
      throw new BotNotMountedError(botId)
    }
    return scoped.bot
  }

  public mountBot = async (botId: string) => {
    const { bot, defService, modelRepo } = await this._botFactory.makeBot(botId)
    this._bots[botId] = { bot, defService, modelRepo }

    await bot.mount()

    let botMounted = false
    const dirtyModelListener = async (language: string) => {
      const latestModelId = await defService.getLatestModelId(language)
      if (await modelRepo.hasModel(latestModelId)) {
        await bot.load(latestModelId)
        return // TODO: announce that training is done
      }

      if (botMounted) {
        return this._trainingQueue.needsTraining({ botId, language })
      }
      botMounted = true
      return this._trainingQueue.queueTraining({ botId, language }, bot)
    }

    defService.listenForDirtyModels(dirtyModelListener)
    await defService.scanForDirtyModels()
  }

  public unmountBot = async (botId: string) => {
    const scoped = this._bots[botId]
    if (!scoped) {
      throw new BotNotMountedError(botId)
    }

    const { bot } = scoped
    await bot.unmount()
    delete this._bots[botId]
  }

  public async queueTraining(botId: string, language: string) {
    const scoped = this._bots[botId]
    if (!scoped) {
      throw new BotNotMountedError(botId)
    }
    return this._trainingQueue.queueTraining({ botId, language }, scoped.bot)
  }

  public async cancelTraining(botId: string, language: string) {
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    return this._trainingQueue.cancelTraining({ botId, language })
  }
}

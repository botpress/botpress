import { Logger } from 'botpress/sdk'
import _ from 'lodash'

import { Bot } from './bot'
import { BotFactory } from './bot-factory'
import { BotNotMountedError } from './errors'
import { NLUClient } from './nlu-client'
import { BotConfig } from './typings'

interface Config {
  queueTrainingsOnBotMount: boolean
}

export class NLUApplication {
  private _bots: _.Dictionary<Bot> = {}

  constructor(
    private _nluClient: NLUClient,
    private _botFactory: BotFactory,
    private _config: Partial<Config>,
    protected _logger: Logger
  ) {}

  public async teardown() {
    for (const botId of Object.keys(this._bots)) {
      await this.unmountBot(botId)
    }
  }

  public async getHealth(opt: { reportError: boolean } = { reportError: true }) {
    try {
      const { health } = await this._nluClient.getInfo()
      return health
    } catch (err) {
      opt.reportError && this._logger.attachError(err).error('An error occured when fetch info from NLU Server.')
      return
    }
  }

  public hasBot(botId: string) {
    return !!this._bots[botId]
  }

  public getBot(botId: string): Bot {
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    return bot
  }

  public async mountBot(botConfig: BotConfig) {
    const { id: botId } = botConfig
    const bot = await this._botFactory.makeBot(botConfig)
    this._bots[botId] = bot
    return bot.mount({
      queueTraining: !!this._config.queueTrainingsOnBotMount
    })
  }

  public async unmountBot(botId: string) {
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }

    await bot.unmount()
    delete this._bots[botId]
  }

  public async queueTraining(botId: string, language: string) {
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }

    // the Bot class will report progress and handle errors
    void bot
      .train(language)
      .then(_.identity)
      .catch(_.identity)
  }
}

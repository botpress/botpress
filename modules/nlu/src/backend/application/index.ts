import * as sdk from 'botpress/sdk'
import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import { Bot } from './bot'
import { ScopedDefinitionsService } from './definitions-service'
import { BotNotMountedError } from './errors'
import { ScopedDefinitionsRepository } from './infrastructure/definitions-repository'
import { ScopedModelRepository } from './infrastructure/model-repository'
import pickSeed from './pick-seed'
import { BotDefinition, Predictor, TrainingQueue } from './typings'

export class NLUApplication {
  private _bots: _.Dictionary<Bot> = {}

  constructor(
    private _bp: typeof sdk,
    private _trainingQueue: TrainingQueue,
    private _engine: NLU.Engine,
    private _logger: sdk.Logger,
    private _modelIdService: typeof sdk.NLU.modelIdService
  ) {}

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
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    return this._bots[botId]
  }

  public mountBot = async (botId: string) => {
    const { _engine } = this

    const botConfig = await this._bp.bots.getBotById(botId)
    if (!botConfig) {
      throw new BotNotMountedError(botId)
    }

    const { defaultLanguage } = botConfig
    const languages = _.intersection(botConfig.languages, _engine.getLanguages())
    if (botConfig.languages.length !== languages.length) {
      const missingLangMsg = `Bot ${botId} has configured languages that are not supported by language sources. Configure a before incoming hook to call an external NLU provider for those languages.`
      this._logger.forBot(botId).warn(missingLangMsg, { notSupported: _.difference(botConfig.languages, languages) })
    }

    const botDefinition: BotDefinition = {
      botId,
      defaultLanguage,
      languages,
      seed: pickSeed(botConfig)
    }

    const needsTrainingCallback = (language: string) => {
      return this._trainingQueue.needsTraining({ botId, language })
    }

    // TODO: should resolve those using a factory provided at ctor
    const scopedGhost = this._bp.ghost.forBot(botId)
    const defRepo = new ScopedDefinitionsRepository(botDefinition, this._bp)
    const modelRepo = new ScopedModelRepository(botDefinition, this._modelIdService, scopedGhost)
    const defService = new ScopedDefinitionsService(
      botDefinition,
      this._engine,
      scopedGhost,
      defRepo,
      this._modelIdService,
      needsTrainingCallback
    )

    const bot = new Bot(botDefinition, this._engine, modelRepo, defService, this._modelIdService, this._logger)

    await bot.mount()
    this._bots[botId] = bot

    for (const language of languages) {
      const needsTraining = await defService.needsTraining(language)
      if (needsTraining) {
        await this._trainingQueue.queueTraining({ botId, language }, bot)
      }
    }
  }

  public unmountBot = async (botId: string) => {
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }

    await this._bots[botId].unmount()
    delete this._bots[botId]
  }

  public async queueTraining(botId: string, language: string) {
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    return this._trainingQueue.queueTraining({ botId, language }, bot)
  }

  public async cancelTraining(botId: string, language: string) {
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    return this._trainingQueue.cancelTraining({ botId, language })
  }
}

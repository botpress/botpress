import * as sdk from 'botpress/sdk'
import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import { BotNotMountedError } from './errors'
import pickSeed from './pick-seed'
import { Bot } from './scoped/bot'
import { ScopedDefinitionsService } from './scoped/definitions-service'
import { ScopedDefinitionsRepository } from './scoped/infrastructure/definitions-repository'
import { ScopedModelRepository } from './scoped/infrastructure/model-repository'
import { BotDefinition } from './typings'

interface ScopedServices {
  bot: Bot
  defService: ScopedDefinitionsService
  modelRepo: ScopedModelRepository
}

export class BotFactory {
  constructor(
    private _bp: typeof sdk,
    private _engine: NLU.Engine,
    private _logger: sdk.Logger,
    private _modelIdService: typeof sdk.NLU.modelIdService
  ) {}

  public makeBot = async (botId: string): Promise<ScopedServices> => {
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

    const scopedGhost = this._bp.ghost.forBot(botId)
    const defRepo = new ScopedDefinitionsRepository(botDefinition, this._bp)
    const modelRepo = new ScopedModelRepository(botDefinition, this._modelIdService, scopedGhost)
    const defService = new ScopedDefinitionsService(
      botDefinition,
      this._engine,
      scopedGhost,
      defRepo,
      this._modelIdService
    )

    const bot = new Bot(botDefinition, this._engine, modelRepo, defService, this._modelIdService, this._logger)

    return {
      modelRepo,
      defService,
      bot
    }
  }
}

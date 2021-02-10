import * as sdk from 'botpress/sdk'
import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import pickSeed from './pick-seed'
import { Bot } from './scoped/bot'
import { ScopedDefinitionsService } from './scoped/definitions-service'
import { BotDefinition, BotConfig } from './typings'
import { ModelRepository, DefinitionRepository } from './scoped/typings'

interface ScopedServices {
  bot: Bot
  defService: ScopedDefinitionsService
  modelRepo: ModelRepository
}

export type DefinitionRepositoryFactory = (botDef: BotDefinition) => DefinitionRepository
export type ModelRepositoryFactory = (botDef: BotDefinition) => ModelRepository

export interface ConfigResolver {
  getBotById(botId: string): Promise<BotConfig | undefined>
}

export class BotFactory {
  constructor(
    private _engine: NLU.Engine,
    private _logger: sdk.Logger,
    private _modelIdService: typeof sdk.NLU.modelIdService,
    private _makeDefRepo: DefinitionRepositoryFactory,
    private _makeModelRepo: ModelRepositoryFactory
  ) {}

  public makeBot = async (botConfig: BotConfig): Promise<ScopedServices> => {
    const { id: botId } = botConfig

    const { defaultLanguage } = botConfig
    const languages = _.intersection(botConfig.languages, this._engine.getLanguages())
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

    const modelRepo = this._makeModelRepo(botDefinition)
    const defRepo = this._makeDefRepo(botDefinition)

    const defService = new ScopedDefinitionsService(botDefinition, this._engine, defRepo, this._modelIdService)

    const bot = new Bot(botDefinition, this._engine, modelRepo, defService, this._modelIdService, this._logger)

    return {
      modelRepo,
      defService,
      bot
    }
  }
}

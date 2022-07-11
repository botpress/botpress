import * as sdk from 'botpress/sdk'

import _ from 'lodash'
import { Bot } from './bot'
import { DefinitionsRepository } from './definitions-repository'
import { ModelEntryRepository, ModelEntryService, TrainingEntryService } from './model-entry'
import { NLUClient } from './nlu-client'
import pickSeed from './pick-seed'

import { BotDefinition, BotConfig, TrainingSession } from './typings'

export interface ConfigResolver {
  getBotById(botId: string): Promise<BotConfig | undefined>
}

export class BotFactory {
  constructor(
    private _endpoint: string,
    private _logger: sdk.Logger,
    private _defRepo: DefinitionsRepository,
    private _modelStateRepo: ModelEntryRepository,
    private _webSocket: (ts: TrainingSession) => void
  ) {}

  public makeBot = async (botConfig: BotConfig): Promise<Bot> => {
    const { id: botId } = botConfig

    const client = new NLUClient(this._endpoint)

    const { defaultLanguage } = botConfig
    const { languages: engineLanguages } = await client.getInfo()
    const languages = _.intersection(botConfig.languages, engineLanguages)
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

    const modelService = new ModelEntryService(this._modelStateRepo)
    const trainService = new TrainingEntryService(this._modelStateRepo)
    return new Bot(botDefinition, client, this._defRepo, modelService, trainService, this._logger, this._webSocket)
  }
}

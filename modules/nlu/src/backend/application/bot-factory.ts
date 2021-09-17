import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { Bot } from './bot'
import { DefinitionsRepository } from './definitions-repository'
import { ModelStateService } from './model-state'
import { NLUClient } from './nlu-client'
import pickSeed from './pick-seed'

import { BotDefinition, BotConfig, TrainingSession, ConfigResolver } from './typings'

export class BotFactory {
  constructor(
    private _configResolver: ConfigResolver,
    private _logger: sdk.Logger,
    private _defRepo: DefinitionsRepository,
    private _modelStateService: ModelStateService,
    private _webSocket: (ts: TrainingSession) => void,
    private _http: typeof sdk.http
  ) {}

  public makeBot = async (botConfig: BotConfig): Promise<Bot> => {
    const { id: botId } = botConfig

    const { baseURL, headers } = await this._http.getAxiosConfigForBot(botId)
    const axiosConfig = { headers, baseURL: `${baseURL}/nlu-server` }
    const nluClient = new NLUClient(axiosConfig)

    const { defaultLanguage } = botConfig
    const { languages: engineLanguages } = await nluClient.getInfo()
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

    return new Bot(
      botDefinition,
      this._configResolver,
      nluClient,
      this._defRepo,
      this._modelStateService,
      this._webSocket,
      this._logger
    )
  }
}

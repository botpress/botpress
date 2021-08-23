import * as sdk from 'botpress/sdk'

import _ from 'lodash'
import { Bot } from './bot'
import { DefinitionsRepository } from './definitions-repository'
import { ModelStateService } from './model-state-service'
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
    private _modelStateService: ModelStateService,
    private _webSocket: (ts: TrainingSession) => void
  ) {}

  private makeEngine(botConfig: BotConfig): NLUClient {
    const { cloud } = botConfig

    const stanClient = cloud
      ? new NLUCloudClient({ ...cloud, endpoint: this._languageSource.endpoint })
      : new Client(this._languageSource.endpoint, this._languageSource.authToken)

    return new NLUClient(stanClient, this._languageSource.authToken ?? '')
  }

  public makeBot = async (botConfig: BotConfig): Promise<Bot> => {
    const { id: botId } = botConfig

    const engine = this.makeEngine(botConfig)

    const { defaultLanguage } = botConfig
    const { languages: engineLanguages } = await engine.getInfo()
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

    return new Bot(botDefinition, this._engine, this._defRepo, this._modelStateService, this._webSocket, this._logger)
  }
}

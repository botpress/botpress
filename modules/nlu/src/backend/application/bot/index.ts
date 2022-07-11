import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { DefinitionsRepository } from '../definitions-repository'
import { BotDoesntSpeakLanguageError } from '../errors'
import { ModelEntryService, TrainingEntryService } from '../model-entry'
import { NLUClient } from '../nlu-client'
import { TrainingState, TrainingSession, BotDefinition } from '../typings'
import { Predictor } from './predictor'
import { Trainer } from './trainer'

export interface MountOptions {
  queueTraining: boolean
}

export class Bot {
  private _botId: string
  private _languages: string[]

  private _trainer: Trainer
  private _predictor: Predictor

  constructor(
    bot: BotDefinition,
    _nluClient: NLUClient,
    _defRepo: DefinitionsRepository,
    _models: ModelEntryService,
    _trainings: TrainingEntryService,
    logger: sdk.Logger,
    webSocket: (ts: TrainingSession) => void
  ) {
    this._botId = bot.botId
    this._languages = bot.languages

    this._trainer = new Trainer(bot, _nluClient, _defRepo, _models, _trainings, logger, webSocket)
    this._predictor = new Predictor(bot, _nluClient, _models, logger)
  }

  get id() {
    return this._botId
  }

  get languages() {
    return this._languages
  }

  public async mount(opt: MountOptions) {
    return this._trainer.mount(opt)
  }

  public async unmount() {
    return this._trainer.unmount()
  }

  public train = async (language: string): Promise<void> => {
    if (!this._languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(this._botId, language)
    }
    return this._trainer.train(language)
  }

  public syncAndGetState = async (language: string): Promise<TrainingState> => {
    if (!this._languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(this._botId, language)
    }
    return this._trainer.syncAndGetState(language)
  }

  public cancelTraining = async (language: string) => {
    if (!this._languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(this._botId, language)
    }
    return this._trainer.cancelTraining(language)
  }

  public predict = async (textInput: string, anticipatedLanguage?: string) => {
    return this._predictor.predict(textInput, anticipatedLanguage)
  }
}

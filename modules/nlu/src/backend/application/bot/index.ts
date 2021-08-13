import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { StanEngine } from 'src/backend/stan'
import { DefinitionsRepository } from '../definitions-repository'
import { BotDoesntSpeakLanguageError } from '../errors'
import { IModelStateRepository } from '../model-state-repo'
import { ModelStateService } from '../model-state-service'
import { TrainingState, TrainingSession, BotDefinition } from '../typings'
import { IPredictor, Predictor } from './predictor'
import { ITrainer, Trainer } from './trainer'

export class Bot implements ITrainer, IPredictor {
  private _botId: string
  private _languages: string[]

  private _trainer: Trainer
  private _predictor: Predictor

  constructor(
    bot: BotDefinition,
    engine: StanEngine,
    defRepo: DefinitionsRepository,
    modelStateService: ModelStateService,
    webSocket: (ts: TrainingSession) => void,
    logger: sdk.Logger
  ) {
    this._botId = bot.botId
    this._languages = bot.languages

    this._trainer = new Trainer(bot, engine, defRepo, modelStateService, webSocket, logger)
    this._predictor = new Predictor(bot, engine, modelStateService, logger)
  }

  get id() {
    return this._botId
  }

  public async mount() {
    return this._trainer.initialize()
  }

  public async unmount() {
    return this._trainer.teardown()
  }

  public train = async (language: string): Promise<void> => {
    if (!this._languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(this._botId, language)
    }
    return this._trainer.train(language)
  }

  public getTraining = async (language: string): Promise<TrainingState> => {
    if (!this._languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(this._botId, language)
    }
    return this._trainer.getTraining(language)
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

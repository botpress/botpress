import * as sdk from 'botpress/sdk'
import { I } from '../typings'
import { IDefinitionsRepository } from './infrastructure/definitions-repository'

type DirtyModelCallback = (language: string) => Promise<void>

interface BotDefinition {
  languages: string[]
  seed: number
  botId: string
}

export type IDefinitionsService = I<ScopedDefinitionsService>

interface TrainingSet {
  intentDefs: sdk.NLU.IntentDefinition[]
  entityDefs: sdk.NLU.EntityDefinition[]
  languageCode: string
  seed: number // seeds random number generator in nlu training
}

export class ScopedDefinitionsService {
  private _languages: string[]
  private _seed: number

  private _needTrainingWatcher: sdk.ListenHandle

  private _dirtyModelsListeners: DirtyModelCallback[] = []

  constructor(bot: BotDefinition, private _definitionRepository: IDefinitionsRepository) {
    this._languages = bot.languages
    this._seed = bot.seed
  }

  public async initialize() {
    this._needTrainingWatcher = this._registerNeedTrainingWatcher()
  }

  public async teardown() {
    this._needTrainingWatcher.remove()
  }

  public listenForDirtyModels = (listener: DirtyModelCallback) => {
    this._dirtyModelsListeners.push(listener)
  }

  public checkForDirtyModels = async () => {
    await Promise.map(this._languages, this._notifyListeners)
  }

  public async getTrainSet(languageCode: string): Promise<TrainingSet> {
    const trainDefinitions = await this._definitionRepository.getTrainDefinitions()

    return {
      ...trainDefinitions,
      languageCode,
      seed: this._seed
    }
  }

  private _registerNeedTrainingWatcher = () => {
    return this._definitionRepository.onFileChanged(async filePath => {
      const hasPotentialNLUChange = filePath.includes('/intents/') || filePath.includes('/entities/')
      if (!hasPotentialNLUChange) {
        return
      }
      await Promise.map(this._languages, this._notifyListeners)
    })
  }

  private _notifyListeners = (language: string) => {
    return Promise.mapSeries(this._dirtyModelsListeners, l => {
      return l(language)
    })
  }
}

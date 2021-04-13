import * as sdk from 'botpress/sdk'
import * as NLU from 'common/nlu/engine'
import { I } from '../typings'
import { IDefinitionsRepository } from './infrastructure/definitions-repository'

type DirtyModelCallback = (language: string) => Promise<void>

interface BotDefinition {
  languages: string[]
  seed: number
}

export type IDefinitionsService = I<ScopedDefinitionsService>

export class ScopedDefinitionsService {
  private _languages: string[]
  private _seed: number

  private _needTrainingWatcher: sdk.ListenHandle

  private _dirtyModelsListeners: DirtyModelCallback[] = []

  constructor(
    bot: BotDefinition,
    private _engine: NLU.Engine,
    private _definitionRepository: IDefinitionsRepository,
    private _modelIdService: typeof NLU.modelIdService
  ) {
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

  public async getLatestModelId(languageCode: string): Promise<NLU.ModelId> {
    const { _engine } = this

    const trainSet = await this.getTrainSet(languageCode)

    const specifications = _engine.getSpecifications()
    return this._modelIdService.makeId({
      ...trainSet,
      specifications
    })
  }

  public async getTrainSet(languageCode: string): Promise<NLU.TrainingSet> {
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

      await Promise.filter(this._languages, async l => {
        const modelId = await this.getLatestModelId(l)
        return !this._engine.hasModel(modelId)
      }).mapSeries(this._notifyListeners)
    })
  }

  private _notifyListeners = (language: string) => {
    return Promise.mapSeries(this._dirtyModelsListeners, l => l(language))
  }
}

import * as sdk from 'botpress/sdk'
import { NLU } from 'botpress/sdk'

import { ScopedDefinitionsRepository } from './infrastructure/definitions-repository'

type DirtyModelCallback = (language: string) => Promise<void>

interface BotDefinition {
  languages: string[]
  seed: number
}

export class ScopedDefinitionsService {
  private _languages: string[]
  private _seed: number

  private _needTrainingWatcher: sdk.ListenHandle

  private _dirtyModelsListeners: DirtyModelCallback[] = []

  constructor(
    bot: BotDefinition,
    private _engine: NLU.Engine,
    private _ghost: sdk.ScopedGhostService,
    private _nluRepository: ScopedDefinitionsRepository,
    private _modelIdService: typeof sdk.NLU.modelIdService
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

  public scanForDirtyModels = async () => {
    await Promise.filter(this._languages, this._needsTraining).mapSeries(this._notifyListeners)
  }

  private async _needsTraining(language: string): Promise<boolean> {
    const modelId = await this.getLatestModelId(language)
    if (this._engine.hasModel(modelId)) {
      return false
    }
    return true
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

  public async getTrainSet(languageCode: string): Promise<sdk.NLU.TrainingSet> {
    const { _nluRepository } = this

    const trainDefinitions = await _nluRepository.getTrainDefinitions()

    return {
      ...trainDefinitions,
      languageCode,
      seed: this._seed
    }
  }

  private _registerNeedTrainingWatcher = () => {
    return this._ghost.onFileChanged(async filePath => {
      const hasPotentialNLUChange = filePath.includes('/intents/') || filePath.includes('/entities/')
      if (!hasPotentialNLUChange) {
        return
      }
      await this.scanForDirtyModels()
    })
  }

  private _notifyListeners = (language: string) => {
    return Promise.mapSeries(this._dirtyModelsListeners, l => l(language))
  }
}

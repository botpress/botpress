import * as sdk from 'botpress/sdk'
import { StanEngine } from 'src/backend/stan'
import modelIdService, { ModelId } from 'src/backend/stan/model-id-service'
import { mapTrainSet } from '../../stan/api-mapper'
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
  private _botId: string

  private _needTrainingWatcher: sdk.ListenHandle

  private _dirtyModelsListeners: DirtyModelCallback[] = []

  constructor(
    bot: BotDefinition,
    private _engine: StanEngine,
    private _definitionRepository: IDefinitionsRepository,
    private _modelIdService: typeof modelIdService
  ) {
    this._languages = bot.languages
    this._seed = bot.seed
    this._botId = bot.botId
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

  public async getLatestModelId(languageCode: string): Promise<ModelId> {
    const { _engine } = this

    const bpTrainSet = await this.getTrainSet(languageCode)
    const stanTrainSet = mapTrainSet(bpTrainSet)

    const { specs } = await _engine.getInfo()
    return this._modelIdService.makeId({
      ...stanTrainSet,
      specifications: specs
    })
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

      await Promise.filter(this._languages, async l => {
        const modelId = await this.getLatestModelId(l)
        return !this._engine.hasModel(this._botId, modelId)
      }).mapSeries(this._notifyListeners)
    })
  }

  private _notifyListeners = (language: string) => {
    return Promise.mapSeries(this._dirtyModelsListeners, l => l(language))
  }
}

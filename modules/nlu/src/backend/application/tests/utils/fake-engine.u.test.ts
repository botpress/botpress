import * as NLUEngine from './sdk.u.test'
import _ from 'lodash'

import { modelIdService } from './fake-model-id-service.u.test'
import './sdk.u.test'
import { areEqual, sleep } from './utils.u.test'

export interface FakeEngineOptions {
  trainDelayBetweenProgress: number
  nProgressCalls: number
}

const DEFAULT_OPTIONS: FakeEngineOptions = {
  trainDelayBetweenProgress: 0,
  nProgressCalls: 2
}

export class FakeEngine implements NLUEngine.Engine {
  private _models: NLUEngine.Model[] = []
  private _options: FakeEngineOptions

  constructor(
    private languages: string[],
    private specs: NLUEngine.Specifications,
    opt: Partial<FakeEngineOptions> = {}
  ) {
    this._options = { ...DEFAULT_OPTIONS, ...opt }
    const { nProgressCalls } = this._options
    if (nProgressCalls < 2 || nProgressCalls > 10) {
      throw new Error("There's a minimum of 2 progress calls and a maximum of 10 for a training...")
    }
  }

  getHealth = (): NLUEngine.Health => {
    return {
      isEnabled: true,
      validLanguages: [...this.languages],
      validProvidersCount: 1
    }
  }

  getLanguages = (): string[] => {
    return [...this.languages]
  }

  getSpecifications = (): NLUEngine.Specifications => {
    return this.specs
  }

  loadModel = async (model: NLUEngine.Model): Promise<void> => {
    if (!this.hasModel(model)) {
      this._models.push(model)
    }
  }

  unloadModel = (modelId: NLUEngine.ModelId): void => {
    const idx = this._models.findIndex(m => areEqual(m, modelId))
    if (idx >= 0) {
      this._models.splice(idx, 1)
    }
  }

  hasModel = (modelId: NLUEngine.ModelId): boolean => {
    return this._models.findIndex(m => areEqual(m, modelId)) >= 0
  }

  train = async (
    trainSessionId: string,
    trainSet: NLUEngine.TrainingSet,
    options: Partial<NLUEngine.TrainingOptions> = {}
  ): Promise<NLUEngine.Model> => {
    const { nProgressCalls, trainDelayBetweenProgress } = this._options
    const { languageCode, seed, intentDefs, entityDefs } = trainSet

    const delta = 1 / (nProgressCalls - 1)
    const updates = _.range(nProgressCalls).map(i => i * delta)
    for (const u of updates) {
      options.progressCallback?.(u)
      await sleep(trainDelayBetweenProgress)
    }

    const modelId = modelIdService.makeId({
      entityDefs,
      intentDefs,
      languageCode,
      seed,
      specifications: this.getSpecifications()
    })

    return {
      ...modelId,
      startedAt: new Date(),
      finishedAt: new Date(),
      data: {
        input: '',
        output: ''
      }
    }
  }

  cancelTraining = async (trainSessionId: string): Promise<void> => {
    return
  }

  detectLanguage = async (text: string, modelByLang: _.Dictionary<NLUEngine.ModelId>): Promise<string> => {
    return 'en'
  }

  predict = async (text: string, modelId: NLUEngine.ModelId): Promise<NLUEngine.PredictOutput> => {
    return {
      entities: [],
      predictions: {
        global: {
          confidence: 1,
          oos: 0,
          intents: [{ label: 'problem', confidence: 1, extractor: 'classifier', slots: {} }]
        }
      }
    }
  }

  spellCheck = async (sentence: string, modelId: NLUEngine.ModelId): Promise<string> => {
    return sentence
  }
}

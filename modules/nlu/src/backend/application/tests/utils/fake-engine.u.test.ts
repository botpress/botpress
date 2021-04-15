import * as NLUEngine from './sdk.u.test'
import _ from 'lodash'

import './sdk.u.test'
import { areEqual, sleep } from './utils.u.test'
import { PredictOutput, TrainInput, Specifications, Health } from '../../../stan/typings'

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

  constructor(private languages: string[], private specs: Specifications, opt: Partial<FakeEngineOptions> = {}) {
    this._options = { ...DEFAULT_OPTIONS, ...opt }
    const { nProgressCalls } = this._options
    if (nProgressCalls < 2 || nProgressCalls > 10) {
      throw new Error("There's a minimum of 2 progress calls and a maximum of 10 for a training...")
    }
  }

  getHealth = (): Health => {
    return {
      isEnabled: true,
      validLanguages: [...this.languages],
      validProvidersCount: 1
    }
  }

  getLanguages = (): string[] => {
    return [...this.languages]
  }

  getSpecifications = (): Specifications => {
    return this.specs
  }

  loadModel = async (model: NLUEngine.Model): Promise<void> => {
    if (!this.hasModel(model.id)) {
      this._models.push(model)
    }
  }

  unloadModel = (modelId: NLUEngine.ModelId): void => {
    const idx = this._models.findIndex(m => areEqual(m.id, modelId))
    if (idx >= 0) {
      this._models.splice(idx, 1)
    }
  }

  hasModel = (modelId: NLUEngine.ModelId): boolean => {
    return this._models.findIndex(m => areEqual(m.id, modelId)) >= 0
  }

  train = async (
    trainSessionId: string,
    trainSet: TrainInput,
    options: Partial<NLUEngine.TrainingOptions> = {}
  ): Promise<NLUEngine.Model> => {
    const { nProgressCalls, trainDelayBetweenProgress } = this._options
    const { language, seed, intents, entities } = trainSet

    const delta = 1 / (nProgressCalls - 1)
    const updates = _.range(nProgressCalls).map(i => i * delta)
    for (const u of updates) {
      options.progressCallback?.(u)
      await sleep(trainDelayBetweenProgress)
    }

    const actualModelIdService = NLUEngine.modelIdService
    const modelId = actualModelIdService.makeId({
      intents,
      entities,
      language,
      seed,
      specifications: this.getSpecifications()
    })

    return {
      id: modelId,
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

  predict = async (text: string, modelId: NLUEngine.ModelId): Promise<PredictOutput> => {
    return {
      spellChecked: '',
      entities: [],
      contexts: [
        {
          name: 'global',
          confidence: 1,
          oos: 0,
          intents: [{ name: 'problem', confidence: 1, extractor: 'classifier', slots: [] }]
        }
      ]
    }
  }

  spellCheck = async (sentence: string, modelId: NLUEngine.ModelId): Promise<string> => {
    return sentence
  }
}

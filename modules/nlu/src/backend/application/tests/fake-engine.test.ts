import { NLU } from 'botpress/sdk'
import ms from 'ms'

import { areEqual, computeContentHash, computeSpecificationsHash, sleep } from './utils.test'

export interface FakeEngineOptions {
  trainDelayBetweenProgress: number
  nProgressCalls: number // TODO: actually implement this
}

const DEFAULT_OPTIONS: FakeEngineOptions = {
  trainDelayBetweenProgress: 0,
  nProgressCalls: 2
}

export const ENGINE_SPECS: NLU.Specifications = {
  languageServer: {
    dimensions: 300,
    domain: 'lol',
    version: '1.0.0'
  },
  nluVersion: '1.0.0'
}

export class FakeEngine implements NLU.Engine {
  private _models: NLU.Model[] = []
  private _options: FakeEngineOptions

  constructor(private languages: string[], private opt: Partial<FakeEngineOptions> = {}) {
    this._options = { ...DEFAULT_OPTIONS, ...opt }
    if (this._options.nProgressCalls < 2) {
      throw new Error("There's a minimum of 2 progress calls for a training...")
    }
  }

  getHealth = (): NLU.Health => {
    return {
      isEnabled: true,
      validLanguages: [...this.languages],
      validProvidersCount: 1
    }
  }

  getLanguages = (): string[] => {
    return [...this.languages]
  }

  getSpecifications = (): NLU.Specifications => {
    return ENGINE_SPECS
  }

  loadModel = async (model: NLU.Model): Promise<void> => {
    if (!this.hasModel(model)) {
      this._models.push(model)
    }
  }

  unloadModel = (modelId: NLU.ModelId): void => {
    const idx = this._models.findIndex(m => areEqual(m, modelId))
    if (idx >= 0) {
      this._models.splice(idx, 1)
    }
  }

  hasModel = (modelId: NLU.ModelId): boolean => {
    return this._models.findIndex(m => areEqual(m, modelId)) >= 0
  }

  train = async (
    trainSessionId: string,
    trainSet: NLU.TrainingSet,
    options?: Partial<NLU.TrainingOptions> | undefined
  ): Promise<NLU.Model> => {
    options.progressCallback?.(0)
    await sleep(this._options.trainDelayBetweenProgress)
    options.progressCallback?.(1)

    const { languageCode, seed, intentDefs, entityDefs } = trainSet
    const specs = this.getSpecifications()

    return {
      startedAt: new Date(),
      finishedAt: new Date(),
      contentHash: computeContentHash(entityDefs, intentDefs, languageCode),
      languageCode,
      seed,
      specificationHash: computeSpecificationsHash(specs),
      data: {
        input: '',
        output: ''
      }
    }
  }

  cancelTraining = async (trainSessionId: string): Promise<void> => {
    return
  }

  detectLanguage = async (text: string, modelByLang: _.Dictionary<NLU.ModelId>): Promise<string> => {
    return 'en'
  }

  predict = async (text: string, modelId: NLU.ModelId): Promise<NLU.PredictOutput> => {
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

  spellCheck = async (sentence: string, modelId: NLU.ModelId): Promise<string> => {
    return sentence
  }
}

test(__filename, () => {})

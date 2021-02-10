import { NLU } from 'botpress/sdk'

import { areEqual } from './utils.test'

export class FakeEngine implements NLU.Engine {
  private _models: NLU.Model[] = []

  constructor(private languages: string[]) {}

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
    return {
      languageServer: {
        dimensions: 300,
        domain: 'lol',
        version: '1.0.0'
      },
      nluVersion: '1.0.0'
    }
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
    const { languageCode, seed } = trainSet
    return {
      startedAt: new Date(),
      finishedAt: new Date(),
      contentHash: 'lol1234',
      languageCode,
      seed,
      specificationHash: 'hihi5432',
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

import { NLU } from 'botpress/sdk'

import { areEqual, computeContentHash, computeSpecificationsHash, sleep } from './utils.u.test'

export interface FakeEngineOptions {
  trainDelayBetweenProgress: number
  nProgressCalls: number // TODO: actually implement this
  trainingThrows: Error | undefined
}

const DEFAULT_OPTIONS: FakeEngineOptions = {
  trainDelayBetweenProgress: 0,
  nProgressCalls: 2,
  trainingThrows: undefined
}

export class FakeEngine implements NLU.Engine {
  private _models: NLU.Model[] = []
  private _options: FakeEngineOptions

  constructor(
    private languages: string[],
    private specs: NLU.Specifications,
    private opt: Partial<FakeEngineOptions> = {}
  ) {
    this._options = { ...DEFAULT_OPTIONS, ...opt }
    const { nProgressCalls } = this._options
    if (nProgressCalls < 2 || nProgressCalls > 10) {
      throw new Error("There's a minimum of 2 progress calls and a maximum of 10 for a training...")
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
    return this.specs
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
    options: Partial<NLU.TrainingOptions> = {}
  ): Promise<NLU.Model> => {
    const { trainingThrows } = this._options
    if (trainingThrows) {
      throw trainingThrows
    }

    const { nProgressCalls, trainDelayBetweenProgress } = this._options
    let progressCallsCount = 0
    const deltaProgress = 1 / nProgressCalls
    while (progressCallsCount < nProgressCalls) {
      progressCallsCount++
      options.progressCallback?.(progressCallsCount * deltaProgress)
      await sleep(trainDelayBetweenProgress)
    }

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

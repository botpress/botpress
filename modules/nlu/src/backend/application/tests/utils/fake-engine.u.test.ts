import _ from 'lodash'

import './sdk.u.test'
import { sleep } from './utils.u.test'
import { PredictOutput, TrainInput, Specifications, Health } from '../../../stan/typings_v1'
import { IStanEngine } from '../../../stan'
import modelIdService from '../../../stan/model-id-service'
import { TrainingCanceledError } from '../../../stan/errors'

export interface FakeEngineOptions {
  trainDelayBetweenProgress: number
  nProgressCalls: number
  models: string[]
}

const DEFAULT_OPTIONS: FakeEngineOptions = {
  trainDelayBetweenProgress: 0,
  nProgressCalls: 2,
  models: []
}

type Training = {
  run: (progressCb: (p: number) => void) => Promise<void>
  cancel: () => void
}

export class FakeEngine implements IStanEngine {
  private _options: FakeEngineOptions

  private _models: string[]
  private _trainings: {
    [modelId: string]: Training
  } = {}

  constructor(private languages: string[], private specs: Specifications, opt: Partial<FakeEngineOptions> = {}) {
    this._options = { ...DEFAULT_OPTIONS, ...opt }
    this._models = opt.models ?? []
    const { nProgressCalls } = this._options
    if (nProgressCalls < 2 || nProgressCalls > 10) {
      throw new Error("There's a minimum of 2 progress calls and a maximum of 10 for a training...")
    }
  }

  public async hasModelFor(appId: string, trainInput: TrainInput): Promise<{ exists: boolean; modelId: string }> {
    const structModelId = modelIdService.makeId({ ...trainInput, specifications: this.specs })
    const modelId = modelIdService.toString(structModelId)
    const exists = await this.hasModel(appId, modelId)
    return {
      exists,
      modelId
    }
  }

  public async getModelIdFromTrainset(trainInput: TrainInput): Promise<string> {
    const { specs } = await this.getInfo()
    const modelIdStructure = modelIdService.makeId({
      ...trainInput,
      specifications: specs
    })
    return modelIdService.toString(modelIdStructure)
  }

  private _getHealth = (): Health => {
    return {
      isEnabled: true,
      validLanguages: [...this.languages],
      validProvidersCount: 1
    }
  }

  getInfo = async () => {
    return {
      specs: this.specs,
      health: this._getHealth(),
      languages: [...this.languages]
    }
  }

  hasModel = async (appId: string, modelId: string): Promise<boolean> => {
    return this._models.includes(modelId)
  }

  startTraining = async (appId: string, trainSet: TrainInput): Promise<string> => {
    const { nProgressCalls, trainDelayBetweenProgress } = this._options
    const { language, seed, intents, entities } = trainSet

    const modelId = modelIdService.toString(
      modelIdService.makeId({
        intents,
        entities,
        language,
        seed,
        specifications: this.specs
      })
    )

    let canceled = false
    const run = async (progressCallback: (n: number) => void) => {
      const delta = 1 / (nProgressCalls - 1)
      const updates = _.range(nProgressCalls).map(i => i * delta)
      for (const u of updates) {
        if (canceled) {
          throw new TrainingCanceledError()
        }
        progressCallback(u)
        await sleep(trainDelayBetweenProgress)
      }
    }

    this._trainings[modelId] = {
      run,
      cancel: () => {
        canceled = true
      }
    }

    return modelId
  }

  waitForTraining = async (appId: string, modelId: string, progressCb: (p: number) => void): Promise<void> => {
    try {
      await this._trainings[modelId].run(progressCb)
    } finally {
      delete this._trainings[modelId]
    }
  }

  cancelTraining = async (appId: string, modelId: string): Promise<void> => {
    if (this._trainings[modelId]) {
      this._trainings[modelId].cancel()
    }
  }

  detectLanguage = async (appId: string, text: string, models: string[]): Promise<string> => {
    return 'en'
  }

  predict = async (appId: string, text: string, modelId: string): Promise<PredictOutput> => {
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
}

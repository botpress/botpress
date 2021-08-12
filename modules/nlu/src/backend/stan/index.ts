import { Client, TrainInput, PredictOutput, Health, Specifications, TrainingProgress } from '@botpress/nlu-client'

import _ from 'lodash'
import { PollingWatcherPool } from './watcher-pool'

export class StanEngine {
  private _watchPool: PollingWatcherPool<[string, string], TrainingProgress>

  constructor(private _client: Client, private _appSecret: string) {
    this._watchPool = new PollingWatcherPool<[string, string], TrainingProgress>(this.checkTraining.bind(this), 500, {
      makeKey: (appId: string, modelId: string) => `${appId}/${modelId}`,
      parseKey: (key: string) => key.split('/') as [string, string]
    })
  }

  public get trainWatcher() {
    return this._watchPool
  }

  public async getInfo(): Promise<{
    health: Health
    specs: Specifications
    languages: string[]
  }> {
    const response = await this._client.getInfo()
    if (!response.success) {
      return this._throwError(response.error)
    }
    return response.info
  }

  public async hasModel(appId: string, modelId: string): Promise<boolean> {
    const response = await this._client.listModels({ appSecret: this._appSecret, appId })
    if (!response.success) {
      return this._throwError(response.error)
    }
    return response.models.includes(modelId)
  }

  public async startTraining(appId: string, trainInput: TrainInput): Promise<string> {
    const { entities, intents, seed, language } = trainInput

    const contexts = _(intents)
      .flatMap(i => i.contexts)
      .uniq()
      .value()

    const response = await this._client.startTraining({
      contexts,
      entities,
      intents,
      language,
      seed,

      appSecret: this._appSecret,
      appId
    })

    if (!response.success) {
      return this._throwError(response.error)
    }

    return response.modelId
  }

  public async getTraining(appId: string, modelId: string): Promise<TrainingProgress | undefined> {
    const response = await this._client.getTrainingStatus(modelId, { appSecret: this._appSecret, appId })
    if (!response.success) {
      return
    }
    return response.session
  }

  private async checkTraining(appId: string, modelId: string): Promise<TrainingProgress> {
    const response = await this._client.getTrainingStatus(modelId, { appSecret: this._appSecret, appId })
    if (!response.success) {
      throw new Error(response.error)
    }
    return response.session
  }

  public async cancelTraining(appId: string, modelId: string): Promise<void> {
    const response = await this._client.cancelTraining(modelId, { appSecret: this._appSecret, appId })
    if (!response.success) {
      return this._throwError(response.error)
    }
  }

  public async detectLanguage(appId: string, utterance: string, models: string[]): Promise<string> {
    const response = await this._client.detectLanguage({
      models,
      utterances: [utterance],
      appSecret: this._appSecret,
      appId
    })

    if (!response.success) {
      return this._throwError(response.error)
    }

    return response.detectedLanguages[0]
  }

  public async predict(appId: string, utterance: string, modelId: string): Promise<PredictOutput> {
    const response = await this._client.predict(modelId, {
      utterances: [utterance],
      appSecret: this._appSecret,
      appId
    })
    if (!response.success) {
      return this._throwError(response.error)
    }
    return response.predictions[0]
  }

  private _throwError(err: string): never {
    throw new Error(`An error occured in NLU server: ${err}`)
  }
}

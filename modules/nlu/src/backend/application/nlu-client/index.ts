import { Client, Health, PredictOutput, Specifications, TrainingState, TrainInput } from '@botpress/nlu-client'
import { AxiosRequestConfig } from 'axios'
import _ from 'lodash'
import { isLocalHost } from './is-localhost'

export type TrainListener = (
  tp: TrainingState | undefined
) => Promise<{ keepListening: true } | { keepListening: false; err?: Error }>

/** Wrapper over actual nlu-client to map errors */
export class NLUClient {
  private _client: Client

  constructor(endpoint: string) {
    const config: AxiosRequestConfig = { baseURL: endpoint, validateStatus: () => true }
    if (isLocalHost(endpoint)) {
      config.proxy = false
    }
    this._client = new Client(config)
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

  public async pruneModels(appId: string): Promise<string[]> {
    const response = await this._client.pruneModels(appId)
    if (!response.success) {
      return this._throwError(response.error)
    }
    return response.models
  }

  public async listModels(appId: string): Promise<string[]> {
    const response = await this._client.listModels(appId)
    if (!response.success) {
      return this._throwError(response.error)
    }
    return response.models
  }

  public async startTraining(appId: string, trainInput: TrainInput): Promise<string> {
    const { entities, intents, seed, language } = trainInput

    const contexts = _(intents)
      .flatMap(i => i.contexts)
      .uniq()
      .value()

    const response = await this._client.startTraining(appId, {
      contexts,
      entities,
      intents,
      language,
      seed
    })

    if (!response.success) {
      return this._throwError(response.error)
    }

    return response.modelId
  }

  public async getTraining(appId: string, modelId: string): Promise<TrainingState | undefined> {
    const response = await this._client.getTrainingStatus(appId, modelId)
    if (!response.success) {
      return
    }
    return response.session
  }

  public async cancelTraining(appId: string, modelId: string): Promise<void> {
    const response = await this._client.cancelTraining(appId, modelId)
    if (!response.success) {
      return this._throwError(response.error)
    }
  }

  public async detectLanguage(appId: string, utterance: string, models: string[]): Promise<string> {
    const response = await this._client.detectLanguage(appId, {
      models,
      utterances: [utterance]
    })

    if (!response.success) {
      return this._throwError(response.error)
    }

    return response.detectedLanguages[0]
  }

  public async predict(appId: string, utterance: string, modelId: string): Promise<PredictOutput> {
    const response = await this._client.predict(appId, modelId, { utterances: [utterance] })
    if (!response.success) {
      return this._throwError(response.error)
    }
    const preds = response.predictions[0]
    return preds
  }

  private _throwError(err: string): never {
    throw new Error(`An error occured in NLU server: ${err}`)
  }
}

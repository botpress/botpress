import { Client, Health, PredictOutput, Specifications } from '@botpress/nlu-client'
import { AxiosInstance } from 'axios'
import { CloudConfig } from 'botpress/sdk'
import _ from 'lodash'
import { CloudClient } from './cloud/client'

interface Options {
  endpoint: string
  cloud?: CloudConfig
}

export class NLUClient {
  private _client: Client | CloudClient

  constructor(options: Options) {
    this._client = options.cloud
      ? new CloudClient({
          endpoint: options.endpoint,
          ...options.cloud
        })
      : new Client({ baseURL: options.endpoint, validateStatus: () => true })
  }

  public get axios(): AxiosInstance {
    return this._client.axios
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

import { Client, Health, PredictOutput, Specifications } from '@botpress/nlu-client'
import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { CloudConfig } from 'botpress/runtime-sdk'
import _ from 'lodash'
import { CloudNluClient } from '../../cloud/nlu'

interface Options {
  endpoint: string
  isLocal: boolean
  cloud?: CloudConfig
}

/**
 * in "@botpress/nlu-client@v1.0.0": typeof response.error === "string"
 * in "@botpress/nlu-client@v1.0.1": typeof response.error === "object"
 */
interface NLUError {
  message: string
  stack?: string
  type: string
  code: number
}

export class NLUClient {
  private _client: Client | CloudNluClient

  constructor(options: Options) {
    if (options.cloud) {
      this._client = new CloudNluClient({
        baseURL: options.endpoint,
        ...options.cloud
      })
      return
    }

    const config: AxiosRequestConfig = { baseURL: options.endpoint, validateStatus: () => true }
    if (options.isLocal) {
      config.proxy = false // allows to reach localhost when HTTP_PROXY env variable is defined
    }

    this._client = new Client(config)
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

  private _throwError(err: string | NLUError): never {
    const prefix = 'An error occured in NLU server'
    if (_.isString(err)) {
      throw new Error(`${prefix}: ${err}`)
    }
    throw new Error(`${prefix}: ${err.message}`)
  }
}

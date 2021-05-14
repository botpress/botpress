import axios, { AxiosInstance } from 'axios'

import _ from 'lodash'
import {
  TrainResponseBody,
  TrainRequestBody,
  InfoResponseBody,
  TrainProgressResponseBody,
  Credentials,
  SuccessReponse,
  DetectLangRequestBody,
  DetectLangResponseBody,
  ListModelsResponseBody,
  PruneModelsResponseBody,
  PredictRequestBody,
  PredictResponseBody,
  ErrorResponse
} from './http-typings'

export class StanClient {
  private _client: AxiosInstance

  constructor(private _stanEndpoint: string, private _authToken?: string) {
    this._client = axios.create({
      baseURL: this._stanEndpoint,
      headers: { Authorization: `Bearer ${this._authToken}` }
    })
  }

  public async getInfo(): Promise<InfoResponseBody | ErrorResponse> {
    return this._wrapWithTryCatch(async () => {
      const { data } = await this._client.get('info')
      return data
    })
  }

  public async startTraining(trainRequestBody: TrainRequestBody): Promise<TrainResponseBody | ErrorResponse> {
    return this._wrapWithTryCatch(async () => {
      const { data } = await this._client.post('train', trainRequestBody)
      return data
    })
  }

  public async getTrainingStatus(
    modelId: string,
    credentials: Credentials
  ): Promise<TrainProgressResponseBody | ErrorResponse> {
    return this._wrapWithTryCatch(async () => {
      const endpoint = `train/${modelId}`
      const { data } = await this._client.get(endpoint, { params: credentials })
      return data
    })
  }

  public async cancelTraining(modelId: string, credentials: Credentials): Promise<SuccessReponse | ErrorResponse> {
    return this._wrapWithTryCatch(async () => {
      const endpoint = `train/${modelId}/cancel`
      const { data } = await this._client.post(endpoint, credentials)
      return data
    })
  }

  public async listModels(credentials: Credentials): Promise<ListModelsResponseBody | ErrorResponse> {
    return this._wrapWithTryCatch(async () => {
      const endpoint = 'models/'
      const { data } = await this._client.get(endpoint, { params: credentials })
      return data
    })
  }

  public async pruneModels(credentials: Credentials): Promise<PruneModelsResponseBody | ErrorResponse> {
    return this._wrapWithTryCatch(async () => {
      const endpoint = 'models/prune'
      const { data } = await this._client.get(endpoint, { params: credentials })
      return data
    })
  }

  public async detectLanguage(
    detectLangRequestBody: DetectLangRequestBody
  ): Promise<DetectLangResponseBody | ErrorResponse> {
    return this._wrapWithTryCatch(async () => {
      const endpoint = 'detect-lang'
      const { data } = await this._client.post(endpoint, detectLangRequestBody)
      return data
    })
  }

  public async predict(
    modelId: string,
    predictRequestBody: PredictRequestBody
  ): Promise<PredictResponseBody | ErrorResponse> {
    return this._wrapWithTryCatch(async () => {
      const endpoint = `predict/${modelId}`
      const { data } = await this._client.post(endpoint, predictRequestBody)
      return data
    })
  }

  private async _wrapWithTryCatch<T>(fn: () => Promise<T>) {
    try {
      const ret = await fn()
      return ret
    } catch (err) {
      const { response } = err ?? {}
      if (_.isBoolean(response?.data?.success)) {
        return response.data // in this case the response body contains details about error
      }
      throw err // actual http error
    }
  }
}

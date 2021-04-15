import axios, { AxiosInstance } from 'axios'

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
      baseURL: this._stanEndpoint
    })
  }

  public async getInfo(): Promise<InfoResponseBody | ErrorResponse> {
    const { data } = await this._client.get('info')
    return data
  }

  public async startTraining(trainRequestBody: TrainRequestBody): Promise<TrainResponseBody | ErrorResponse> {
    const { data } = await this._client.post('train', trainRequestBody)
    return data
  }

  public async getTrainingStatus(
    modelId: string,
    credentials: Credentials
  ): Promise<TrainProgressResponseBody | ErrorResponse> {
    const endpoint = `train/${modelId}`
    const { session } = await this._client.get(endpoint, { params: credentials })
    return session
  }

  public async cancelTraining(modelId: string, credentials: Credentials): Promise<SuccessReponse | ErrorResponse> {
    const endpoint = `train/${modelId}/cancel`
    return this._client.post(endpoint, credentials)
  }

  public async listModels(credentials: Credentials): Promise<ListModelsResponseBody | ErrorResponse> {
    const endpoint = 'models/'
    const { data } = await this._client.get(endpoint, { params: credentials })
    return data
  }

  public async pruneModels(credentials: Credentials): Promise<PruneModelsResponseBody | ErrorResponse> {
    const endpoint = 'models/prune'
    const { data } = await this._client.get(endpoint, { params: credentials })
    return data
  }

  public async detectLanguage(
    detectLangRequestBody: DetectLangRequestBody
  ): Promise<DetectLangResponseBody | ErrorResponse> {
    const endpoint = 'detect-lang'
    const { data } = await this._client.post(endpoint, detectLangRequestBody)
    return data
  }

  public async predict(
    modelId: string,
    predictRequestBody: PredictRequestBody
  ): Promise<PredictResponseBody | ErrorResponse> {
    const endpoint = `predict/${modelId}`
    const { data } = await this._client.post(endpoint, predictRequestBody)
    return data
  }
}

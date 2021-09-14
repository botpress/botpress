import { Client, Health, PredictOutput, Specifications } from '@botpress/nlu-client'
import _ from 'lodash'

export class NLUClient {
  private _client: Client

  constructor(endpoint: string) {
    this._client = new Client(endpoint)
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

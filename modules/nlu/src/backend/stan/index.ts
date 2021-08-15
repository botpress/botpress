import { Client, TrainInput, PredictOutput, Health, Specifications, TrainingState } from '@botpress/nlu-client'

import _ from 'lodash'

type TrainListener = (tp: TrainingState | undefined) => Promise<'keep-listening' | 'stop-listening'>

const TRAIN_POLLING_MS = 500

export class StanEngine {
  constructor(private _client: Client, private _appSecret: string) {}

  public listenForTraining(botId: string, modelId: string, l: TrainListener) {
    const interval = setInterval(async () => {
      const tp = await this.getTraining(botId, modelId)
      const ret = await l(tp)
      if (ret === 'stop-listening') {
        clearInterval(interval)
      }
    }, TRAIN_POLLING_MS)
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
    const response = await this._client.pruneModels({ appSecret: this._appSecret, appId })
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

  public async getTraining(appId: string, modelId: string): Promise<TrainingState | undefined> {
    const response = await this._client.getTrainingStatus(modelId, { appSecret: this._appSecret, appId })
    if (!response.success) {
      return
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

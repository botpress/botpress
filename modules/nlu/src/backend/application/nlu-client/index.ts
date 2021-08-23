import { Client, Health, Specifications, TrainingState } from '@botpress/nlu-client'

import _ from 'lodash'
import { BpPredictOutput, BpTrainSet, mapPredictOutput, mapTrainSet } from './api-mapper'

export type TrainListener = (tp: TrainingState | undefined) => Promise<'keep-listening' | 'stop-listening'>

const TRAIN_POLLING_MS = 500

export class NLUClientWrapper {
  constructor(private _client: Client) {}

  public listenForTraining(botId: string, modelId: string, l: TrainListener) {
    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const tp = await this.getTraining(botId, modelId)
          const ret = await l(tp)
          if (ret === 'stop-listening') {
            clearInterval(interval)
            return resolve()
          }
        } catch (err) {
          reject(err)
        }
      }, TRAIN_POLLING_MS)
    })
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

  public async startTraining(appId: string, bpTrainSet: BpTrainSet): Promise<string> {
    const trainInput = mapTrainSet(bpTrainSet)
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

  public async predict(appId: string, utterance: string, modelId: string): Promise<BpPredictOutput> {
    const response = await this._client.predict(appId, modelId, { utterances: [utterance] })
    if (!response.success) {
      return this._throwError(response.error)
    }
    const preds = response.predictions[0]
    return mapPredictOutput(preds)
  }

  private _throwError(err: string): never {
    throw new Error(`An error occured in NLU server: ${err}`)
  }
}

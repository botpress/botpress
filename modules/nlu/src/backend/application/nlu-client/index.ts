import { Client, Health, Specifications, TrainingState } from '@botpress/nlu-client'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { TrainingSet } from '../typings'
import { mapTrainSet } from './api-mapper'

export type TrainListener = (
  tp: TrainingState | undefined
) => Promise<{ keepListening: true } | { keepListening: false; err?: Error }>

const TRAIN_POLLING_MS = 500

export class NLUClient {
  private _client: Client

  constructor(axiosConfig: sdk.AxiosBotConfig) {
    this._client = new Client(axiosConfig)
  }

  public listenForTraining(botId: string, modelId: string, l: TrainListener) {
    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const tp = await this.getTraining(botId, modelId)
          if (!tp) {
            return
          }
          const ret = await l(tp)
          if (!ret.keepListening) {
            clearInterval(interval)
            if (!ret.err) {
              return resolve()
            }
            return reject(ret.err)
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

  public async startTraining(appId: string, trainset: TrainingSet): Promise<string> {
    const trainInput = mapTrainSet(trainset)
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

  private _throwError(err: string): never {
    throw new Error(`An error occured in NLU server: ${err}`)
  }
}

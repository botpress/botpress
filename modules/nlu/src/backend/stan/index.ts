import { Client, TrainInput, PredictOutput, Health, Specifications, TrainingError } from '@botpress/nlu-client'
import _ from 'lodash'
import { I } from '../application/typings'
import { TrainingCanceledError, TrainingAlreadyStartedError } from './errors'
import modelIdService from './model-id-service'

const TRAIN_PROGRESS_POLLING_INTERVAL = 500

export type IStanEngine = I<StanEngine>

export class StanEngine {
  constructor(private _client: Client, private _appSecret: string) {}

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

  public async hasModelFor(appId: string, trainInput: TrainInput): Promise<{ exists: boolean; modelId: string }> {
    const { specs } = await this.getInfo()
    const modelIdStructure = modelIdService.makeId({
      ...trainInput,
      specifications: specs
    })
    const modelId = modelIdService.toString(modelIdStructure)
    const exists = await this._hasModel(appId, modelId)
    return {
      exists,
      modelId
    }
  }

  private async _hasModel(appId: string, modelId: string): Promise<boolean> {
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

  public async waitForTraining(appId: string, modelId: string, progressCb: (p: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        const response = await this._client.getTrainingStatus(modelId, { appSecret: this._appSecret, appId })
        if (!response.success) {
          clearInterval(interval)
          reject(new Error(response.error))
          return
        }

        const { progress, status, error: serializedError } = response.session

        if (status === 'training') {
          progressCb(progress)
          return
        }

        if (status === 'done') {
          clearInterval(interval)
          resolve()
          return
        }

        if (status === 'canceled') {
          clearInterval(interval)
          reject(new TrainingCanceledError())
          return
        }

        if (status === 'errored') {
          clearInterval(interval)
          const error = this._mapTrainError(serializedError)
          reject(error)
          return
        }
      }, TRAIN_PROGRESS_POLLING_INTERVAL)
    })
  }

  private _mapTrainError = (serializedError: TrainingError | undefined): Error => {
    if (serializedError?.type === 'already-started') {
      return new TrainingAlreadyStartedError()
    }

    const defaultMessage = 'An error occured during training'
    const { message, stackTrace } = serializedError ?? {}
    const unknownError = new Error(message ?? defaultMessage)
    if (stackTrace) {
      unknownError.stack = stackTrace
    }
    return unknownError
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

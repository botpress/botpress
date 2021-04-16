import _ from 'lodash'
import { StanClient } from '../stan/client'
import modelIdService, { ModelId } from '../stan/model-id-service'
import { TrainInput, PredictOutput, Health, Specifications, TrainingError } from '../stan/typings_v1'
import { TrainingCanceledError, TrainingAlreadyStartedError } from './errors'

const TRAIN_PROGRESS_POLLING_INTERVAL = 500

export class StanEngine {
  // TODO: pass this as a config
  constructor(private _stanClient: StanClient, private _appSecret: string) {}

  public async getInfo(): Promise<{
    health: Health
    specs: Specifications
    languages: string[]
  }> {
    const response = await this._stanClient.getInfo()
    if (!response.success) {
      return this._throwError(response.error)
    }
    return response.info
  }

  public async startTraining(appId: string, trainInput: TrainInput): Promise<ModelId> {
    const { entities, intents, seed, language } = trainInput

    const contexts = _(intents)
      .flatMap(i => i.contexts)
      .uniq()
      .value()

    const response = await this._stanClient.startTraining({
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

    return modelIdService.fromString(response.modelId)
  }

  public async waitForTraining(appId: string, modelId: ModelId, progressCb: (p: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        const stringId = modelIdService.toString(modelId)
        const response = await this._stanClient.getTrainingStatus(stringId, { appSecret: this._appSecret, appId })
        if (!response.success) {
          clearInterval(interval)
          reject(new Error(response.error))
          return
        }

        const { progress, status, error: serializedError } = response.session

        progressCb(progress)

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
          reject(error) // TODO: find out when this happends and try sending the actual message
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

  public async cancelTraining(appId: string, modelId: ModelId): Promise<void> {
    const stringId = modelIdService.toString(modelId)
    const response = await this._stanClient.cancelTraining(stringId, { appSecret: this._appSecret, appId })
    if (!response.success) {
      return this._throwError(response.error)
    }
  }

  public async hasModel(appId: string, modelId: ModelId): Promise<boolean> {
    const stringId = modelIdService.toString(modelId)
    const response = await this._stanClient.listModels({ appSecret: this._appSecret, appId })
    if (!response.success) {
      return this._throwError(response.error)
    }
    return response.models.includes(stringId)
  }

  public async detectLanguage(appId: string, utterance: string, models: ModelId[]): Promise<string> {
    const response = await this._stanClient.detectLanguage({
      models: models.map(modelIdService.toString),
      utterances: [utterance],
      appSecret: this._appSecret,
      appId
    })

    if (!response.success) {
      return this._throwError(response.error)
    }

    return response.detectedLanguages[0]
  }

  public async predict(appId: string, utterance: string, modelId: ModelId): Promise<PredictOutput> {
    const stringId = modelIdService.toString(modelId)
    const response = await this._stanClient.predict(stringId, {
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
    throw new Error(`${err}`)
  }
}

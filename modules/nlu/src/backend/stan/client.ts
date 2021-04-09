import axios, { AxiosInstance } from 'axios'
import * as sdk from 'botpress/sdk'
import * as NLUEngine from 'common/nlu/engine'
import { TrainInput, PredictOutput, TrainingSession } from './typings'

const TRAIN_PROGRESS_POLLING_INTERVAL = 500

export class StanClient {
  private _client: AxiosInstance

  // TODO: pass this as a config
  constructor(private _logger: sdk.Logger, private _stanEndpoint: string = 'http://localhost:3200') {
    this._client = axios.create({
      baseURL: this._stanEndpoint
    })
  }

  public async getInfo(): Promise<{
    health: NLUEngine.Health
    specs: NLUEngine.Specifications
    languages: string[]
  }> {
    const { info } = await this._get('info', undefined)
    return info
  }

  public async startTraining(trainInput: TrainInput): Promise<NLUEngine.ModelId> {
    const { modelId } = await this._post('train', trainInput)
    return NLUEngine.modelIdService.fromString(modelId)
  }

  public async waitForTraining(
    modelId: NLUEngine.ModelId,
    password: string,
    progressCb: (p: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        const { status, progress } = await this._getTrainingStatus(modelId, password)

        progressCb(progress)

        if (status === 'done') {
          clearInterval(interval)
          resolve()
          return
        }

        if (status === 'canceled') {
          clearInterval(interval)
          reject(new Error('Training Canceled')) // TODO: make a special error type
          return
        }

        if (status === 'errored') {
          clearInterval(interval)
          reject(new Error('Error during training.')) // TODO: find out when this happends and try sending the actual message
          return
        }
      }, TRAIN_PROGRESS_POLLING_INTERVAL)
    })
  }

  private async _getTrainingStatus(modelId: NLUEngine.ModelId, password: string): Promise<TrainingSession> {
    const stringId = NLUEngine.modelIdService.toString(modelId)
    const endpoint = `train/${stringId}`
    const { session } = await this._get(endpoint, { password })
    return session
  }

  public async cancelTraining(modelId: NLUEngine.ModelId, password: string): Promise<void> {
    const stringId = NLUEngine.modelIdService.toString(modelId)
    const endpoint = `train/${stringId}/cancel`
    return this._post(endpoint, { password })
  }

  public async hasModel(modelId: NLUEngine.ModelId, password: string): Promise<boolean> {
    const stringId = NLUEngine.modelIdService.toString(modelId)
    const endpoint = `exists/${stringId}`
    const { exists } = await this._get(endpoint, { password })
    return exists
  }

  public async detectLanguage(
    utterance: string,
    models: { modelId: NLUEngine.ModelId; password: string }[]
  ): Promise<string> {
    const { modelId, password } = models[0]
    const stringId = NLUEngine.modelIdService.toString(modelId)
    const endpoint = `detect-lang/${stringId}`
    const { languages } = await this._post(endpoint, { utterances: [utterance], password })
    return languages[0]
  }

  public async predict(utterance: string, modelId: NLUEngine.ModelId, password: string): Promise<PredictOutput> {
    const stringId = NLUEngine.modelIdService.toString(modelId)
    const endpoint = `predict/${stringId}`
    const { predictions } = await this._post(endpoint, { utterances: [utterance], password })
    return predictions[0]
  }

  private async _get(endpoint: string, queryParams: any) {
    try {
      const { data } = await this._client.get(endpoint, { params: queryParams })
      const { success } = data
      if (!success) {
        this._throwError(data)
      }
      return data
    } catch (err) {
      const errMsg = `The following errored occured when calling standalone NLU: [${err}]`
      this._logger.error(errMsg)
    }
  }

  private async _post(endpoint: string, body: any) {
    try {
      const { data } = await this._client.post(endpoint, body)
      const { success } = data
      if (!success) {
        this._throwError(data)
      }
      return data
    } catch (err) {
      const errMsg = `The following errored occured when calling standalone NLU: [${err}]`
      this._logger.error(errMsg)
    }
  }

  private _throwError(response: { err: string | undefined }): never {
    const { err } = response
    throw new Error(`${err}`)
  }
}

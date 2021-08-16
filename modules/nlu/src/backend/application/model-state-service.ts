import crypto from 'crypto'
import _ from 'lodash'
import { IModelStateRepository } from './model-state-repo'
import { BpTrainingSet } from './typings'

const _hashTrainSet = (ts: BpTrainingSet) => {
  return crypto
    .createHash('sha1')
    .update(JSON.stringify(ts))
    .digest('hex')
}

class _Model {
  constructor(private _modelId: string, private _language: string, private _defHash: string) {}

  public get id() {
    return this._modelId
  }

  public get language() {
    return this._language
  }

  public isDirty(ts: BpTrainingSet) {
    const currentHash = _hashTrainSet(ts)
    return this._defHash !== currentHash
  }
}

export class ModelStateService {
  constructor(private _modelRepo: IModelStateRepository) {}

  public async trainingStarted(botId: string, language: string, modelId: string, ts: BpTrainingSet) {
    const definitionHash = _hashTrainSet(ts)
    await this._modelRepo.set({ botId, language, state: 'training', definitionHash, modelId })
  }

  public async trainingDone(botId: string, language: string) {
    const currentTraining = await this._modelRepo.get({ botId, language, state: 'training' })
    if (!currentTraining) {
      throw new Error(`Training of bot ${botId} in language ${language} can't be done before even starting.`)
    }

    currentTraining.state = 'ready'
    await this._modelRepo.del({ botId, language, state: 'ready' })
    await this._modelRepo.set(currentTraining)
  }

  public async getTraining(botId: string, language: string): Promise<_Model | undefined> {
    const currentTraining = await this._modelRepo.get({ botId, language, state: 'training' })
    if (!currentTraining) {
      return
    }
    const { modelId, definitionHash } = currentTraining
    return new _Model(modelId, language, definitionHash)
  }

  public async getModel(botId: string, language: string): Promise<_Model | undefined> {
    const currentTraining = await this._modelRepo.get({ botId, language, state: 'ready' })
    if (!currentTraining) {
      return
    }
    const { modelId, definitionHash } = currentTraining
    return new _Model(modelId, language, definitionHash)
  }

  public async getAllModels(botId: string): Promise<_Model[]> {
    const allModels = await this._modelRepo.query({ botId, state: 'ready' })
    return allModels.map(m => new _Model(m.modelId, m.language, m.definitionHash))
  }
}

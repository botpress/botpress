import { TrainingStatus } from '@botpress/nlu-client'
import crypto from 'crypto'
import _ from 'lodash'
import { TrainingSet } from '../typings'
import { IModelStateRepository } from './model-state-repo'
import { StatusType } from './typings'

const _hashTrainSet = (ts: TrainingSet) => {
  const content = [...ts.entityDefs, ...ts.intentDefs]
  return crypto
    .createHash('sha1')
    .update(JSON.stringify(content))
    .digest('hex')
}

export interface ModelStateKey {
  botId: string
  language: string
  statusType: StatusType
}

export interface ModelStateContent {
  modelId: string
  status: TrainingStatus
  progress: number
}

export interface ModelState extends ModelStateKey, ModelStateContent {}

export class ModelStateService {
  constructor(private _modelRepo: IModelStateRepository) {}

  public async create(modelState: ModelState & { trainset: TrainingSet }) {
    const { botId, language, statusType, modelId, status, progress, trainset } = modelState
    const definitionHash = _hashTrainSet(trainset)
    await this._modelRepo.upsert({
      botId,
      language,
      status_type: statusType,
      definitionHash,
      modelId,
      status,
      progress
    })
  }

  public async update(modelState: ModelStateKey & Partial<ModelStateContent>) {
    const { botId, language, statusType, modelId, status, progress } = modelState
    await this._modelRepo.update({
      botId,
      language,
      status_type: statusType,
      modelId,
      status,
      progress
    })
  }

  public async setReady(modelState: Omit<ModelStateKey, 'statusType'> & Partial<ModelStateContent>) {
    const { botId, language } = modelState

    const notReady = await this._modelRepo.get({ botId, language, status_type: 'not-ready' })
    if (!notReady) {
      throw new Error("can't set current model to ready as it does not exist.")
    }

    await this._modelRepo.del({ botId, language, status_type: 'not-ready' })
    await this._modelRepo.upsert({ ...notReady, ...modelState, status_type: 'ready' })
  }

  public async get(key: ModelStateKey): Promise<(ModelState & { isDirty: (ts: TrainingSet) => boolean }) | undefined> {
    const { botId, language, statusType } = key
    const currentTraining = await this._modelRepo.get({ botId, language, status_type: statusType })
    if (!currentTraining) {
      return
    }

    const { modelId, definitionHash, progress, status } = currentTraining
    return {
      botId,
      language,
      statusType,
      modelId,
      progress,
      status,
      isDirty: (ts: TrainingSet) => {
        const currentHash = _hashTrainSet(ts)
        return definitionHash !== currentHash
      }
    }
  }

  public async delete(key: ModelStateKey): Promise<void> {
    const { botId, language, statusType } = key
    return this._modelRepo.del({ botId, language, status_type: statusType })
  }
}

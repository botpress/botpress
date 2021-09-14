import { TrainingStatus } from '@botpress/nlu-client'
import crypto from 'crypto'
import _ from 'lodash'
import { TrainingSet } from '../typings'
import { IModelStateRepository, ModelStateRow } from './model-state-repo'
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
export type DirtyableModelState = ModelState & { isDirty: (ts: TrainingSet) => boolean }

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

  public async update(modelState: ModelStateKey & Partial<ModelStateContent>): Promise<ModelState> {
    const { botId, language, statusType, modelId, status, progress } = modelState
    const status_type = statusType
    await this._modelRepo.update({
      botId,
      language,
      status_type,
      modelId,
      status,
      progress
    })
    const updated = await this._modelRepo.get({ botId, language, status_type })
    return this._fromRow(updated!)
  }

  public async setReady(
    modelState: Omit<ModelStateKey, 'statusType'> & Partial<ModelStateContent>
  ): Promise<ModelState> {
    const { botId, language } = modelState

    const notReady = await this._modelRepo.get({ botId, language, status_type: 'not-ready' })
    if (!notReady) {
      throw new Error("can't set current model to ready as it does not exist.")
    }

    const { definitionHash } = notReady
    const newState: ModelState = { ...this._fromRow(notReady), statusType: 'ready' }

    await this._modelRepo.del({ botId, language, status_type: 'not-ready' })
    await this._modelRepo.upsert(this._toRow(newState, definitionHash))

    return newState
  }

  public async get(key: ModelStateKey): Promise<DirtyableModelState | undefined> {
    const { botId, language, statusType } = key
    const currentTraining = await this._modelRepo.get({ botId, language, status_type: statusType })
    if (!currentTraining) {
      return
    }

    const { definitionHash } = currentTraining
    return {
      ...this._fromRow(currentTraining),
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

  private _fromRow(row: ModelStateRow): ModelState {
    const { botId, language, status_type, modelId, progress, status } = row
    return {
      botId,
      language,
      statusType: status_type,
      modelId,
      progress,
      status
    }
  }

  private _toRow(modelState: ModelState, definitionHash: string): ModelStateRow {
    const { botId, language, statusType, modelId, progress, status } = modelState
    return {
      botId,
      language,
      status_type: statusType,
      modelId,
      progress,
      status,
      definitionHash
    }
  }
}

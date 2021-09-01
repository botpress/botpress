import crypto from 'crypto'
import _ from 'lodash'
import { IModelStateRepository } from './model-state-repo'
import { TrainingSet } from './typings'

const _hashTrainSet = (ts: TrainingSet) => {
  const content = [...ts.entityDefs, ...ts.intentDefs]
  return crypto
    .createHash('sha1')
    .update(JSON.stringify(content))
    .digest('hex')
}

export class ModelState {
  constructor(private _modelId: string, private _language: string, private _defHash: string) {}

  public get id() {
    return this._modelId
  }

  public get language() {
    return this._language
  }

  public isDirty(ts: TrainingSet) {
    const currentHash = _hashTrainSet(ts)
    return this._defHash !== currentHash
  }
}

/**
 * Training state is dupplicated in botpress server and nlu server.
 * The ground source of truth is the state kept by the nlu-server, but unfortunatly,
 * the botpress server needs to memorize locally what combination of botId+languageCode equals what modelId.
 *
 * This class is thus responsible for handling local state of trainings and models.
 * In other words it works as a (botId, languageCode) => modelId function
 */
export class ModelStateService {
  constructor(private _modelRepo: IModelStateRepository) {}

  public async setTrainingStarted(botId: string, language: string, modelId: string, ts: TrainingSet) {
    const definitionHash = _hashTrainSet(ts)
    await this._modelRepo.set({ botId, language, state: 'training', definitionHash, modelId })
  }

  public async setTrainingDone(botId: string, language: string) {
    const currentTraining = await this._modelRepo.get({ botId, language, state: 'training' })
    if (!currentTraining) {
      throw new Error(`Training of bot ${botId} in language ${language} can't be done before even starting.`)
    }

    currentTraining.state = 'ready'
    await this._modelRepo.del({ botId, language, state: 'ready' })
    await this._modelRepo.set(currentTraining)
  }

  public deleteLocalTrainingState(botId: string, language: string) {
    return this._modelRepo.del({ botId, language, state: 'training' })
  }

  public async getLocalTrainingState(botId: string, language: string): Promise<ModelState | undefined> {
    const currentTraining = await this._modelRepo.get({ botId, language, state: 'training' })
    if (!currentTraining) {
      return
    }
    const { modelId, definitionHash } = currentTraining
    return new ModelState(modelId, language, definitionHash)
  }

  public async getLocalModelState(botId: string, language: string): Promise<ModelState | undefined> {
    const currentTraining = await this._modelRepo.get({ botId, language, state: 'ready' })
    if (!currentTraining) {
      return
    }
    const { modelId, definitionHash } = currentTraining
    return new ModelState(modelId, language, definitionHash)
  }
}

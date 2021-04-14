import crypto from 'crypto'
import LRUCache from 'lru-cache'
import * as NLUEngine from 'nlu/engine'

import { TrainingProgress } from 'nlu/typings_v1'
import * as http from './http-typings'

export default class TrainSessionService {
  private trainSessions: {
    [key: string]: TrainingProgress
  } = {}

  // training sessions of this cache will eventually be kicked out so there's no memory leak
  private releasedTrainSessions = new LRUCache<string, TrainingProgress>(1000)

  constructor() {}

  getTrainingSession(modelId: NLUEngine.ModelId, credentials: http.Credentials): TrainingProgress | undefined {
    const key = this._makeTrainSessionKey(modelId, credentials)
    const ts = this.trainSessions[key]
    if (ts) {
      return ts
    }
    return this.releasedTrainSessions.get(key)
  }

  setTrainingSession(modelId: NLUEngine.ModelId, credentials: http.Credentials, trainSession: TrainingProgress) {
    const key = this._makeTrainSessionKey(modelId, credentials)
    if (this.releasedTrainSessions.get(key)) {
      this.releasedTrainSessions.del(key)
    }
    this.trainSessions[key] = trainSession
  }

  releaseTrainingSession(modelId: NLUEngine.ModelId, credentials: http.Credentials): void {
    const key = this._makeTrainSessionKey(modelId, credentials)
    const ts = this.trainSessions[key]
    delete this.trainSessions[key]
    this.releasedTrainSessions.set(key, ts)
  }

  deleteTrainingSession(modelId: NLUEngine.ModelId, credentials: http.Credentials): void {
    const key = this._makeTrainSessionKey(modelId, credentials)
    if (this.releasedTrainSessions.get(key)) {
      this.releasedTrainSessions.del(key)
    }
    if (this.trainSessions[key]) {
      delete this.trainSessions[key]
    }
  }

  private _makeTrainSessionKey(modelId: NLUEngine.ModelId, credentials: http.Credentials) {
    const stringId = NLUEngine.modelIdService.toString(modelId)

    const { appSecret, appId } = credentials

    return crypto
      .createHash('md5')
      .update(`${stringId}${appSecret}${appId}`)
      .digest('hex')
  }
}

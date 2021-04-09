import crypto from 'crypto'
import LRUCache from 'lru-cache'
import * as NLUEngine from 'nlu/engine'

import { TrainingProgress } from './typings_v1'

export default class TrainSessionService {
  private trainSessions: {
    [key: string]: TrainingProgress
  } = {}

  // training sessions of this cache will eventually be kicked out so there's no memory leak
  private releasedTrainSessions = new LRUCache<string, TrainingProgress>(1000)

  constructor() {}

  getTrainingSession(modelId: NLUEngine.ModelId, password: string): TrainingProgress | undefined {
    const key = this._makeTrainSessionKey(modelId, password)
    const ts = this.trainSessions[key]
    if (ts) {
      return ts
    }
    return this.releasedTrainSessions.get(key)
  }

  setTrainingSession(modelId: NLUEngine.ModelId, password: string, trainSession: TrainingProgress) {
    const key = this._makeTrainSessionKey(modelId, password)
    if (this.releasedTrainSessions.get(key)) {
      this.releasedTrainSessions.del(key)
    }
    this.trainSessions[key] = trainSession
  }

  releaseTrainingSession(modelId: NLUEngine.ModelId, password: string): void {
    const key = this._makeTrainSessionKey(modelId, password)
    const ts = this.trainSessions[key]
    delete this.trainSessions[key]
    this.releasedTrainSessions.set(key, ts)
  }

  private _makeTrainSessionKey(modelId: NLUEngine.ModelId, password: string) {
    const stringId = NLUEngine.modelIdService.toString(modelId)
    return crypto
      .createHash('md5')
      .update(`${stringId}${password}`)
      .digest('hex')
  }
}

import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import LRUCache from 'lru-cache'

export default class TrainSessionService {
  private trainSessions: {
    [key: string]: sdk.NLU.TrainingSession
  } = {}

  // training sessions of this cache will eventually be kicked out so there's no memory leak
  private releasedTrainSessions = new LRUCache<string, sdk.NLU.TrainingSession>(1000)

  constructor() {}

  makeTrainingSession = (modelId: string, password: string, language: string): sdk.NLU.TrainingSession => ({
    key: this._makeTrainSessionKey(modelId, password),
    status: 'training',
    progress: 0,
    language
  })

  getTrainingSession(modelId: string, password: string): sdk.NLU.TrainingSession | undefined {
    const key = this._makeTrainSessionKey(modelId, password)
    const ts = this.trainSessions[key]
    if (ts) {
      return ts
    }
    return this.releasedTrainSessions.get(key)
  }

  setTrainingSession(modelId: string, password: string, trainSession: sdk.NLU.TrainingSession) {
    const key = this._makeTrainSessionKey(modelId, password)
    if (this.releasedTrainSessions.get(key)) {
      this.releasedTrainSessions.del(key)
    }
    this.trainSessions[key] = trainSession
  }

  releaseTrainingSession(modelId: string, password: string): void {
    const key = this._makeTrainSessionKey(modelId, password)
    const ts = this.trainSessions[key]
    delete this.trainSessions[key]
    this.releasedTrainSessions.set(key, ts)
  }

  private _makeTrainSessionKey(modelId: string, password: string) {
    return crypto
      .createHash('md5')
      .update(`${modelId}${password}`)
      .digest('hex')
  }
}

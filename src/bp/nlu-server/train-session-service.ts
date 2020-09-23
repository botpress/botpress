import * as sdk from 'botpress/sdk'
import LRUCache from 'lru-cache'

export default class TrainSessionService {
  private trainSessions: {
    [key: string]: sdk.NLU.TrainingSession
  } = {}

  // training sessions of this cache will eventually be kicked out so there's no memory leak
  private releasedTrainSessions = new LRUCache<string, sdk.NLU.TrainingSession>(1000)

  constructor() {}

  makeTrainingSession = (modelFileName: string, language: string): sdk.NLU.TrainingSession => ({
    key: modelFileName,
    status: 'training',
    progress: 0,
    language
  })

  getTrainingSession(modelFileName: string): sdk.NLU.TrainingSession | undefined {
    const ts = this.trainSessions[modelFileName]
    if (ts) {
      return ts
    }
    return this.releasedTrainSessions.get(modelFileName)
  }

  setTrainingSession(modelFileName: string, trainSession: sdk.NLU.TrainingSession) {
    if (this.releasedTrainSessions.get(modelFileName)) {
      this.releasedTrainSessions.del(modelFileName)
    }
    this.trainSessions[modelFileName] = trainSession
  }

  releaseTrainingSession(modelFileName: string): void {
    const ts = this.trainSessions[modelFileName]
    delete this.trainSessions[modelFileName]
    this.releasedTrainSessions.set(modelFileName, ts)
  }
}

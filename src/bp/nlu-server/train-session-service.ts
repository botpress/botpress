import * as sdk from 'botpress/sdk'

export default class TrainSessionService {
  private trainSessions: {
    [key: string]: sdk.NLU.TrainingSession
  } = {}

  constructor() {}

  makeTrainingSession = (modelFileName: string, language: string): sdk.NLU.TrainingSession => ({
    key: modelFileName,
    status: 'training',
    progress: 0,
    language
  })

  getTrainingSession(modelFileName: string): sdk.NLU.TrainingSession | undefined {
    return this.trainSessions[modelFileName]
  }

  setTrainingSession(modelFileName: string, trainSession: sdk.NLU.TrainingSession) {
    this.trainSessions[modelFileName] = trainSession
  }

  removeTrainingSession(modelFileName: string): void {
    delete this.trainSessions[modelFileName]
  }
}

import * as sdk from 'botpress/sdk'

export default class TrainSessionService {
  private trainSessions: {
    [key: string]: sdk.NLU.TrainingSession
  } = {}

  constructor() {}

  makeTrainingSession = (modelId: string, language: string): sdk.NLU.TrainingSession => ({
    key: modelId,
    status: 'training',
    progress: 0,
    language
  })

  getTrainingSession(modelId: string): sdk.NLU.TrainingSession | undefined {
    return this.trainSessions[modelId]
  }

  setTrainingSession(modelId: string, trainSession: sdk.NLU.TrainingSession) {
    this.trainSessions[modelId] = trainSession
  }

  removeTrainingSession(modelId: string): void {
    delete this.trainSessions[modelId]
  }
}

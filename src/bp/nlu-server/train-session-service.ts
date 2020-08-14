import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import NLUServerKeyValueStore from './kvs'

export default class TrainSessionService {
  constructor(private kvs: NLUServerKeyValueStore) {}

  makeTrainSessionKey = (modelId: string): string => `training:${modelId}`

  makeTrainingSession = (language: string): sdk.NLU.TrainingSession => ({
    status: 'training',
    progress: 0,
    language
  })

  getTrainingSession(modelId: string): sdk.NLU.TrainingSession | undefined {
    const key = this.makeTrainSessionKey(modelId)
    const trainSession = this.kvs.get(key)
    return trainSession
  }

  setTrainingSession(modelId: string, trainSession: sdk.NLU.TrainingSession) {
    const key = this.makeTrainSessionKey(modelId)
    return this.kvs.set(key, _.omit(trainSession, 'lock'))
  }

  removeTrainingSession(modelId: string): void {
    const key = this.makeTrainSessionKey(modelId)
    this.kvs.remove(key)
  }
}

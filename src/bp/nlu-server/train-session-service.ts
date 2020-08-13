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

  async getTrainingSession(modelId: string): Promise<sdk.NLU.TrainingSession | undefined> {
    const key = this.makeTrainSessionKey(modelId)
    const trainSession = await this.kvs.get(key)
    return trainSession
  }

  setTrainingSession(modelId: string, trainSession: sdk.NLU.TrainingSession): Promise<any> {
    const key = this.makeTrainSessionKey(modelId)
    return this.kvs.set(key, _.omit(trainSession, 'lock'))
  }

  async removeTrainingSession(kvs: NLUServerKeyValueStore, modelId: string): Promise<void> {
    const key = this.makeTrainSessionKey(modelId)
    await kvs.remove(key)
  }
}

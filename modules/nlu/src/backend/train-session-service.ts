import * as sdk from 'botpress/sdk'
import _ from 'lodash'

const DEFAULT_TRAINING_SESSION: Partial<sdk.NLU.TrainingSession> = {
  status: 'idle',
  progress: 0
}

type Socket = (botId: string, ts: sdk.NLU.TrainingSession) => Promise<void>
export default class TrainSessionService {
  constructor(private bp: typeof sdk, private socket: Socket) {}

  public makeTrainSessionKey = (botId: string, language: string): string => `training:${botId}:${language}`

  public makeTrainingSession = (botId: string, language: string): sdk.NLU.TrainingSession => ({
    key: this.makeTrainSessionKey(botId, language),
    status: 'training-pending',
    progress: 0,
    language
  })

  public async getTrainingSession(botId: string, language: string): Promise<sdk.NLU.TrainingSession> {
    const key = this.makeTrainSessionKey(botId, language)
    const trainSession = await this.bp.kvs.forBot(botId).get(key)
    return trainSession || { ...DEFAULT_TRAINING_SESSION, language, key }
  }

  public async setTrainingSession(botId: string, trainSession: sdk.NLU.TrainingSession): Promise<any> {
    await this.socket(botId, trainSession)
    return this.bp.kvs.forBot(botId).set(trainSession.key, _.omit(trainSession, 'lock'))
  }

  public async removeTrainingSession(botId: string, trainSession: sdk.NLU.TrainingSession): Promise<void> {
    await this.bp.kvs.forBot(botId).removeStorageKeysStartingWith(trainSession.key)
  }
}

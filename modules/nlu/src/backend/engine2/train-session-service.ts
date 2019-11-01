import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { TrainingSession } from '../typings'

const DEFAULT_TRAINING_SESSION: Partial<TrainingSession> = {
  status: 'idle',
  progress: 0
}

export const makeTrainSessionKey = (botId: string, language: string): string => `training:${botId}:${language}`

export const makeTrainingSession = (language: string, lock: sdk.RedisLock): TrainingSession => ({
  status: 'training',
  progress: 0,
  language,
  lock
})

export async function getTrainingSession(bp: typeof sdk, botId: string, language: string): Promise<TrainingSession> {
  const key = makeTrainSessionKey(botId, language)
  const trainSessionWExpiry = await bp.kvs.forBot(botId).get(key)
  return trainSessionWExpiry ? trainSessionWExpiry.value : { ...DEFAULT_TRAINING_SESSION, language }
}

export function setTrainingSession(bp: typeof sdk, botId: string, trainSession: TrainingSession): Promise<any> {
  const key = makeTrainSessionKey(botId, trainSession.language)
  return bp.kvs.forBot(botId).setStorageWithExpiry(key, _.omit(trainSession, 'lock'), '1m')
}

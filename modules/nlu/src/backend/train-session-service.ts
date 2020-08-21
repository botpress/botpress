import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { TrainingSession } from './typings'

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
  const trainSession = await bp.kvs.forBot(botId).get(key)
  return trainSession || { ...DEFAULT_TRAINING_SESSION, language }
}

export function setTrainingSession(bp: typeof sdk, botId: string, trainSession: TrainingSession): Promise<any> {
  const key = makeTrainSessionKey(botId, trainSession.language)
  return bp.kvs.forBot(botId).set(key, _.omit(trainSession, 'lock'))
}

export async function removeTrainingSession(
  bp: typeof sdk,
  botId: string,
  trainSession: TrainingSession
): Promise<void> {
  await bp.kvs.forBot(botId).removeStorageKeysStartingWith(makeTrainSessionKey(botId, trainSession.language))
}

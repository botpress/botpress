import * as sdk from 'botpress/sdk'
import _ from 'lodash'

const DEFAULT_TRAINING_SESSION: Partial<sdk.NLU.TrainingSession> = {
  status: 'idle',
  progress: 0
}

export const makeTrainSessionKey = (botId: string, language: string): string => `training:${botId}:${language}`

export const makeTrainingSession = (botId: string, language: string, lock: sdk.RedisLock): sdk.NLU.TrainingSession => ({
  key: makeTrainSessionKey(botId, language),
  status: 'training-pending',
  progress: 0,
  language,
  lock
})

export async function getTrainingSession(
  bp: typeof sdk,
  botId: string,
  language: string
): Promise<sdk.NLU.TrainingSession> {
  const key = makeTrainSessionKey(botId, language)
  const trainSession = await bp.kvs.forBot(botId).get(key)
  return trainSession || { ...DEFAULT_TRAINING_SESSION, language, key }
}

export function setTrainingSession(bp: typeof sdk, botId: string, trainSession: sdk.NLU.TrainingSession): Promise<any> {
  return bp.kvs.forBot(botId).set(trainSession.key, _.omit(trainSession, 'lock'))
}

export async function removeTrainingSession(
  bp: typeof sdk,
  botId: string,
  trainSession: sdk.NLU.TrainingSession
): Promise<void> {
  await bp.kvs.forBot(botId).removeStorageKeysStartingWith(trainSession.key)
}

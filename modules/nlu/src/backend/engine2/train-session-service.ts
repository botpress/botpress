import * as sdk from 'botpress/sdk'

import { TrainingSession } from '../typings'

const DEFAULT_TRAINING_SESSION: Partial<TrainingSession> = {
  status: 'idle',
  progress: 0
}

function makeTrainSessionKey(language: string): string {
  return `training:${language}`
}

export async function getTrainingSession(bp: typeof sdk, botId: string, language: string): Promise<TrainingSession> {
  const key = makeTrainSessionKey(language)
  const trainSessionExpiry = await bp.kvs.forBot(botId).get(key)
  return trainSessionExpiry ? trainSessionExpiry.value : { ...DEFAULT_TRAINING_SESSION, language }
}

export function setTrainingSession(bp: typeof sdk, botId: string, trainSession: TrainingSession): Promise<any> {
  const key = makeTrainSessionKey(trainSession.language)
  return bp.kvs.forBot(botId).setStorageWithExpiry(key, trainSession, '1m')
}

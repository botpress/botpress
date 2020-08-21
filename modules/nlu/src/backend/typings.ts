import sdk, { NLU, RedisLock } from 'botpress/sdk'

export interface NluMlRecommendations {
  minUtterancesForML: number
  goodUtterancesForML: number
}

export type NLUState = {
  nluByBot: _.Dictionary<BotState>
  logger: NLU.Logger
  broadcastLoadModel?: (botId: string, hash: string, language: string) => Promise<void>
  broadcastCancelTraining?: (botId: string, language: string) => Promise<void>
  sendNLUStatusEvent: (botId: string, trainSession: TrainingSession) => Promise<void>
}

export type TrainingStatus = 'idle' | 'done' | 'needs-training' | 'training' | 'canceled' | 'errored' | null

export interface TrainingSession {
  status: TrainingStatus
  language: string
  progress: number
  lock?: RedisLock
}

export interface BotState {
  botId: string
  engine: sdk.NLU.Engine
  trainOrLoad: (forceTrain: boolean) => Promise<void>
  trainSessions: _.Dictionary<TrainingSession>
  cancelTraining: () => Promise<void>
}

export interface NLUProgressEvent {
  type: 'nlu'
  working: boolean
  botId: string
  message: string
  trainSession: TrainingSession
}

import sdk from 'botpress/sdk'
import LRUCache from 'lru-cache'

export interface LanguageSource {
  /** The endpoint URL of the source */
  endpoint: string
  /** The authentication token, if required by the source */
  authToken?: string
}

export interface NluMlRecommendations {
  minUtterancesForML: number
  goodUtterancesForML: number
}

export type NLUState = {
  nluByBot: _.Dictionary<BotState>
  broadcastLoadModel?: (botId: string, hash: string, language: string) => Promise<void>
  broadcastCancelTraining?: (botId: string, language: string) => Promise<void>
  reportTrainingProgress: sdk.NLU.ProgressReporter
}

export interface NLUVersionInfo {
  nluVersion: string
  langServerInfo: LangServerInfo
}

export interface LangServerInfo {
  version: string
  domain: string
  dim: number
}

export interface BotState {
  botId: string
  engine: sdk.NLU.Engine
  trainWatcher: sdk.ListenHandle
  trainOrLoad: (forceTrain: boolean) => Promise<void>
  trainSessions: _.Dictionary<TrainingSession>
  cancelTraining: () => Promise<void>
  isTraining: () => Promise<boolean>
}

export type EntityExtractor = 'system' | 'list' | 'pattern'
export interface ExtractedEntity {
  confidence: number
  type: string
  metadata: {
    source: string
    entityId: string
    extractor: EntityExtractor
    unit?: string
    occurrence?: string
  }
  sensitive?: boolean
  value: string
}
export type EntityExtractionResult = ExtractedEntity & { start: number; end: number }

export interface TrainingSession {
  status: 'training' | 'canceled' | 'done' | 'idle'
  language: string
  progress: number
  lock?: sdk.RedisLock
}

export interface NLUProgressEvent {
  type: 'nlu'
  working: boolean
  botId: string
  message: string
  trainSession: TrainingSession
}

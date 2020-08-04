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

export interface EntityService {
  getSystemEntities(): sdk.NLU.EntityDefinition[]
  getCustomEntities(): Promise<sdk.NLU.EntityDefinition[]>
  getEntities(): Promise<sdk.NLU.EntityDefinition[]>
  getEntity(x: string): Promise<sdk.NLU.EntityDefinition>
  deleteEntity(x: string): Promise<void>
  saveEntity(x: sdk.NLU.EntityDefinition): Promise<void>
  updateEntity(x: string, y: sdk.NLU.EntityDefinition): Promise<void>
}

export type NLUState = {
  nluByBot: _.Dictionary<BotState>
  broadcastLoadModel?: (botId: string, hash: string, language: string) => Promise<void>
  broadcastCancelTraining?: (botId: string, language: string) => Promise<void>
  reportTrainingProgress: sdk.NLUCore.ProgressReporter
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
  engine: sdk.NLUCore.NLUEngine
  trainWatcher: sdk.ListenHandle
  trainOrLoad: (forceTrain: boolean) => Promise<void>
  trainSessions: _.Dictionary<TrainingSession>
  cancelTraining: () => Promise<void>
  isTraining: () => Promise<boolean>
  entityService: EntityService
}

export type EntityCache = LRUCache<string, EntityExtractionResult[]>
export type EntityCacheDump = LRUCache.Entry<string, EntityExtractionResult[]>[]

export interface ListEntityModel {
  type: 'custom.list'
  id: string
  languageCode: string
  entityName: string
  fuzzyTolerance: number
  sensitive: boolean
  /** @example { 'Air Canada': [ ['Air', '_Canada'], ['air', 'can'] ] } */
  mappingsTokens: _.Dictionary<string[][]>
  cache?: EntityCache | EntityCacheDump
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

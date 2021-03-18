import { AxiosInstance } from 'axios'
import sdk from 'botpress/sdk'
import LRUCache from 'lru-cache'

import { LanguageSource, Health, Specifications } from '../typings'

export const BIO = {
  INSIDE: 'I',
  BEGINNING: 'B',
  OUT: 'o'
} as _.Dictionary<Tag>

export type Tag = 'o' | 'B' | 'I'

export interface Token2Vec {
  [token: string]: number[]
}

export interface LangServerInfo {
  version: string
  domain: string
  dim: number
}

export interface Gateway {
  source: LanguageSource
  client: AxiosInstance
  errors: number
  disabledUntil?: Date
}

export interface LangsGateway {
  [lang: string]: Gateway[]
}

export interface LanguageProvider {
  languages: string[]
  langServerInfo: LangServerInfo
  vectorize(tokens: string[], lang: string): Promise<Float32Array[]>
  tokenize(utterances: string[], lang: string, vocab?: string[]): Promise<string[][]>
  generateSimilarJunkWords(subsetVocab: string[], lang: string): Promise<string[]>
  getHealth(): Partial<Health>
}

export type TFIDF = _.Dictionary<number>

export type PatternEntity = Readonly<{
  name: string
  pattern: string
  examples: string[]
  matchCase: boolean
  sensitive: boolean
}>

export type ListEntity = Readonly<{
  name: string
  synonyms: { [canonical: string]: string[] }
  fuzzyTolerance: number
  sensitive: boolean
}>

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
}

export type ColdListEntityModel = ListEntityModel & {
  cache: EntityCacheDump
}

export type WarmedListEntityModel = ListEntityModel & {
  cache: EntityCache
}

export interface ExtractedSlot {
  confidence: number
  name: string
  source: string
  value: any
  entity?: EntityExtractionResult
}

export interface SlotExtractionResult {
  slot: ExtractedSlot
  start: number
  end: number
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

export interface KeyedItem {
  input: string
  idx: number
  entities?: EntityExtractionResult[]
}

export interface SeededLodashProvider {
  setSeed(seed: number): void
  getSeededLodash(): _.LoDashStatic
  resetSeed(): void
}

export interface Tools {
  // pre-trained language focused tools
  tokenize_utterances(utterances: string[], languageCode: string, vocab?: string[]): Promise<string[][]>
  vectorize_tokens(tokens: string[], languageCode: string): Promise<number[][]>
  partOfSpeechUtterances(utterances: string[][], languageCode: string): string[][]
  generateSimilarJunkWords(vocabulary: string[], languageCode: string): Promise<string[]>
  getStopWordsForLang(lang: string): Promise<string[]>

  // system info
  getHealth(): Health
  getLanguages(): string[]
  getSpecifications(): Specifications

  seededLodashProvider: SeededLodashProvider
  mlToolkit: typeof sdk.MLToolkit
  systemEntityExtractor: SystemEntityExtractor
}

export interface SystemEntityExtractor {
  extractMultiple(input: string[], lang: string, useCache?: Boolean): Promise<EntityExtractionResult[][]>
  extract(input: string, lang: string): Promise<EntityExtractionResult[]>
}

export type Intent<T> = Readonly<{
  name: string
  contexts: string[]
  slot_definitions: SlotDefinition[]
  utterances: T[]
}>

export type SlotDefinition = Readonly<{
  name: string
  entities: string[]
}>

export type SerializedKmeansResult = Omit<sdk.MLToolkit.KMeans.KmeansResult, 'nearest'>

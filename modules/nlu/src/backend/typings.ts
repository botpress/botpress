import { AxiosInstance } from 'axios'
import sdk from 'botpress/sdk'

export const BIO = {
  INSIDE: 'I',
  BEGINNING: 'B',
  OUT: 'o'
}

export type Tag = 'o' | 'B' | 'I'

export interface Token {
  tag?: Tag
  value: string
  cannonical: string
  slot?: string
  start: number
  end: number
  matchedEntities: string[]
}

// TODO get rid of this and use upcoming Utterance
export interface Sequence {
  intent: string
  cannonical: string
  tokens: Token[]
  contexts?: string[]
}

export interface TrainingSequence extends Sequence {
  knownSlots: KnownSlot[]
}

export interface KnownSlot extends sdk.NLU.SlotDefinition {
  start: number
  end: number
  source: string
}

export type EngineByBot = { [botId: string]: Engine }

export interface Engine {
  trainOrLoad(forceRetrain: boolean): Promise<string>
  checkSyncNeeded(): Promise<boolean>
  extract(text: string, lastMessages: string[], includedContexts: string[]): Promise<sdk.IO.EventUnderstanding>
}

export interface EntityExtractor {
  extract(input: string, lang: string): Promise<sdk.NLU.Entity[]>
}

export interface SlotExtractor {
  load(trainingSet: Sequence[], language: Buffer, crf: Buffer): Promise<void>
  train(trainingSet: Sequence[]): Promise<{ language: Buffer | undefined; crf: Buffer | undefined }>
  extract(ds: NLUStructure, intent: sdk.NLU.IntentDefinition): Promise<sdk.NLU.SlotCollection>
}

export type IntentModel = { name: string; model: Buffer }

export interface IntentClassifier {
  load(models: IntentModel[]): Promise<void>
  train(intents: sdk.NLU.IntentDefinition[]): Promise<IntentModel[]>
  predict(input: string, includedContexts: string[]): Promise<sdk.NLU.Intent[]>
}

export interface LanguageIdentifier {
  identify(input: string): Promise<sdk.MLToolkit.FastText.PredictResult[]>
}

export const MODEL_TYPES = {
  INTENT: ['intent-l0', 'intent-l1', 'intent-tfidf', 'vocab'],
  SLOT_CRF: 'slot-crf'
}

export interface ModelMeta {
  fileName?: string
  created_on: number // timestamp
  hash: string
  context: string
  type: string
  scope: string
}

export interface Model {
  meta: ModelMeta
  model: Buffer
}

export interface NLUStructure {
  rawText: string
  sanitizedText: string
  sanitizedLowerText: string
  detectedLanguage: string
  language: string
  includedContexts: string[]
  lastMessages: string[]
  slots: { [key: string]: sdk.NLU.Slot }
  entities: sdk.NLU.Entity[]
  ambiguous: boolean
  intents: sdk.NLU.Intent[]
  intent: sdk.NLU.Intent
  tokens: Token[]
  errored: boolean
}

export type Token2Vec = { [token: string]: number[] }

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
  vectorize(tokens: string[], lang: string): Promise<Float32Array[]>
  tokenize(utterances: string[], lang: string): Promise<string[][]>
  generateSimilarJunkWords(subsetVocab: string[], lang: string): Promise<string[]>
  getHealth(): Partial<NLUHealth>
}

export interface LanguageSource {
  /** The endpoint URL of the source */
  endpoint: string
  /** The authentication token, if required by the source */
  authToken?: string
}

export interface NLUHealth {
  isEnabled: boolean
  validProvidersCount: number
  validLanguages: string[]
}

export interface NluMlRecommendations {
  minUtterancesForML: number
  goodUtterancesForML: number
}

export interface Engine2 {
  loadModel: Function
  train: Function
  predict: Function
}

export interface NLUState {
  nluByBot: _.Dictionary<BotState>
  languageProvider?: LanguageProvider
  health?: NLUHealth
  broadcastLoadModel?: (botId: string, hash: string, language: string) => Promise<void>
  broadcastCancelTraining?: (botId: string, language: string) => Promise<void>
}

export interface BotState {
  botId: string
  engine1: Engine
  engine: Engine2
  trainWatcher: sdk.ListenHandle
  trainSessions: _.Dictionary<TrainingSession>
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

export type ListEntityModel = Readonly<{
  type: 'custom.list'
  id: string
  languageCode: string
  entityName: string
  fuzzyTolerance: number
  sensitive: boolean
  /** @example { 'Air Canada': [ ['Air', '_Canada'], ['air', 'can'] ] } */
  mappingsTokens: _.Dictionary<string[][]>
}>

// add value in extracted slots
export type ExtractedSlot = { confidence: number; name: string; source: any }
export type ExtractedEntity = { confidence: number; type: string; metadata: any; value: string }
export type EntityExtractionResult = ExtractedEntity & { start: number; end: number }

export interface TrainingSession {
  status: 'training' | 'canceled' | 'done' | 'idle'
  language: string
  progress: number
  lock?: sdk.RedisLock
}

export interface Tools {
  tokenize_utterances(utterances: string[], languageCode: string): Promise<string[][]>
  vectorize_tokens(tokens: string[], languageCode: string): Promise<number[][]>
  partOfSpeechUtterances(utterances: string[][], languageCode: string): string[][]
  generateSimilarJunkWords(vocabulary: string[], languageCode: string): Promise<string[]>
  reportTrainingProgress(botId: string, message: string, trainSession: TrainingSession): void
  ducklingExtractor: EntityExtractor
  mlToolkit: typeof sdk.MLToolkit
}

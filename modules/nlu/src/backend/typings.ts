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
  slot?: string
  start: number
  end: number
  matchedEntities: string[]
}

export interface Sequence {
  intent: string
  cannonical: string
  tokens: Token[]
  contexts?: string[]
}

export type EngineByBot = { [botId: string]: Engine }

export interface Engine {
  trainOrLoad(forceRetrain: boolean): Promise<string>
  checkSyncNeeded(): Promise<boolean>
  extract(text: string, includedContexts: string[]): Promise<sdk.IO.EventUnderstanding>
}

export interface EntityExtractor {
  extract(input: string, lang: string): Promise<sdk.NLU.Entity[]>
}

export interface SlotExtractor {
  load(trainingSet: Sequence[], language: Buffer, crf: Buffer): Promise<void>
  train(trainingSet: Sequence[]): Promise<{ language: Buffer | undefined; crf: Buffer | undefined }>
  extract(
    input: string,
    lang: string,
    intent: sdk.NLU.IntentDefinition,
    entities: sdk.NLU.Entity[],
    tokens: string[]
  ): Promise<sdk.NLU.SlotCollection>
}

export type IntentModel = { name: string; model: Buffer }

export interface IntentClassifier {
  load(models: IntentModel[]): Promise<void>
  train(intents: sdk.NLU.IntentDefinition[]): Promise<IntentModel[]>
  predict(input: string, includedContexts: string[]): Promise<sdk.NLU.Intent[]>
}

export interface LanguageIdentifier {
  identify(input: string): Promise<string>
}

export const MODEL_TYPES = {
  INTENT: ['intent-l0', 'intent-l1', 'intent-tfidf', 'vocab'],
  SLOT_LANG: 'slot-language-model',
  SLOT_CRF: 'slot-crf',
  INTENT_LM: 'intent-lm'
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
  lowerText: string
  detectedLanguage: string
  language: string
  includedContexts: string[]
  slots: { [key: string]: sdk.NLU.Slot }
  entities: sdk.NLU.Entity[]
  intents: sdk.NLU.Intent[]
  intent: sdk.NLU.Intent
  tokens: string[]
}

export interface PipelineProcessManager {
  withPipeline(pipeline: Function[]): PipelineProcessManager
  initFromText(text: string, includedContexts: string[]): PipelineProcessManager
  run(): Promise<NLUStructure>
}

export interface LangsGateway {
  [lang: string]: { source: LanguageSource; client: AxiosInstance; errors: number; disabledUntil?: Date }[]
}

export interface LanguageProvider {
  vectorize(tokens: string[], lang: string): Promise<number[][]>
  tokenize(text: string, lang: string): Promise<string[]>
  getHealth(): Partial<NLUHealth>
}

export interface FastTextOverrides {
  learningRate?: number
  epoch?: number
  wordNgrams?: number
}

export interface LanguageSource {
  /** The endpoint URL of the source */
  endpoint: string
  /** The authentication token, if required by the source */
  authToken?: string
}

export interface NLUHealth {
  isEnabled: boolean
  isDucklingEnabled: boolean
  validProvidersCount: number
  validLanguages: string[]
}

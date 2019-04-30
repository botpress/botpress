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
  sync(forceRetrain: boolean): Promise<string>
  checkSyncNeeded(): Promise<boolean>
  extract(text: string, includedContexts: string[]): Promise<sdk.IO.EventUnderstanding>
}

export interface EntityExtractor {
  extract(input: string, lang: string): Promise<sdk.NLU.Entity[]>
}

export interface SlotExtractor {
  load(trainingSet: Sequence[], language: Buffer, crf: Buffer): Promise<void>
  train(trainingSet: Sequence[]): Promise<{ language: Buffer | undefined; crf: Buffer | undefined }>
  extract(input: string, intent: sdk.NLU.IntentDefinition, entities: sdk.NLU.Entity[]): Promise<sdk.NLU.SlotsCollection>
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
  INTENT: 'intent',
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

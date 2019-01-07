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
}

export type EngineByBot = { [botId: string]: Engine }

export type Prediction = { name: string; confidence: number }

export interface Engine {
  sync(): Promise<void>
  checkSyncNeeded(): Promise<boolean>
  extract(event): Promise<sdk.IO.EventUnderstanding>
}

export interface EntityExtractor {
  extract(input: string, lang: string): Promise<sdk.NLU.Entity[]>
}

export interface SlotExtractor {
  load: Function
  train(trainingSet: Sequence[]): Promise<any>
  extract(input: string, intent: sdk.NLU.IntentDefinition, entities: sdk.NLU.Entity[]): Promise<sdk.NLU.SlotsCollection>
}

export interface IntentClassifier {
  predict(input: string): Promise<Prediction[]>
}

export interface LanguageIdentifier {
  identify(input: string): Promise<string>
}


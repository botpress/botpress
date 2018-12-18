import sdk from 'botpress/sdk'

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
  train(trainingSet: Sequence[]): Promise<void>
  extract(input: string, intent: sdk.NLU.IntentDefinition, entities: sdk.NLU.Entity[]): Promise<sdk.NLU.IntentSlot[]>
}

export interface IntentClassifier {
  predict(input: string): Promise<Prediction[]>
}

export interface LanguageIdentifier {
  identify(input: string): Promise<string>
}


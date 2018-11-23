declare type EngineByBot = { [botId: string]: Engine }

declare interface Engine {
  sync(): Promise<void>
  checkSyncNeeded(): Promise<boolean>
  extract(event): Promise<Predictions.ExtractResult>
}

declare interface EntityExtractor {
  extract(input: string, lang: string): Promise<Predictions.Entity[]>
}

declare interface IntentClassifier {
  predict(input: string): Promise<Predictions.Intent[]>
}

declare interface LanguageIdentifier {
  identify(input: string): Promise<string>
}

declare namespace Predictions {
  interface ExtractResult {
    intent: Intent
    intents: Intent[]
    language: string
    entities: Entity[]
  }

  interface Intent {
    name: string
    confidence: number
  }

  interface Entity {
    type: string
    meta: EntityMeta
    data: EntityBody
  }

  interface EntityBody {
    extras: any
    value: any
    unit: string
  }

  interface EntityMeta {
    confidence: number
    provider: string
    source: string
    start: number
    end: number
    raw: any
  }
}

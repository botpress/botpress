import { IO, NLU as SDKNLU } from 'botpress/sdk'

export interface BotConfig {
  id: string
  defaultLanguage: string
  languages: string[]
  nluSeed?: number
  cloud?: CloudConfig
}

export interface CloudConfig {
  oauthUrl: string
  clientId: string
  clientSecret: string
}

export interface BotDefinition {
  botId: string
  defaultLanguage: string
  languages: string[]
  seed: number
}

export interface TrainingState {
  status: SDKNLU.TrainingStatus
  progress: number
}

export interface TrainingId {
  botId: string
  language: string
}

export interface TrainingSession extends TrainingId, TrainingState {}

export interface PredictOutput {
  entities: SDKNLU.Entity[]
  predictions: Dic<SDKNLU.ContextPrediction>
  spellChecked: string
}

export interface TrainingSet {
  intentDefs: SDKNLU.IntentDefinition[]
  entityDefs: SDKNLU.EntityDefinition[]
  languageCode: string
  seed: number
}

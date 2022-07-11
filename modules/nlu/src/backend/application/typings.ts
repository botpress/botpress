import { NLU as SDKNLU } from 'botpress/sdk'

export interface BotConfig {
  id: string
  defaultLanguage: string
  languages: string[]
  nluSeed?: number
}

export interface BotDefinition {
  botId: string
  defaultLanguage: string
  languages: string[]
  seed: number
}

export interface TrainingError {
  type: string
  message: string
}

export interface TrainingState {
  status: SDKNLU.TrainingStatus
  progress: number
  error?: TrainingError
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

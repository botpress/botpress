// Typings for Stan's API v1

/**
 * ################################
 * ############ INPUTS ############
 * ################################
 */
export interface TrainInput {
  language: string
  contexts: string[]
  intents: IntentDefinition[]
  entities: (ListEntityDefinition | PatternEntityDefinition)[]
  password: string
  seed?: number
}

export interface IntentDefinition {
  name: string
  contexts: string[]
  utterances: string[]
  slots: SlotDefinition[]
}

export interface SlotDefinition {
  name: string
  entities: string[]
}

export interface ListEntityDefinition {
  name: string
  type: 'list'
  values: { name: string; synonyms: string[] }[]
  fuzzy: number
}

export interface PatternEntityDefinition {
  name: string
  type: 'pattern'
  regex: string
  case_sensitive: boolean
  examples: string[]
}

export interface PredictInput {
  utterances: string[]
  password: string
}

/**
 * #################################
 * ############ OUTPUTS ############
 * #################################
 */
export interface PredictOutput {
  entities: EntityPrediction[]
  contexts: ContextPrediction[]
  utterance: string
  spellChecked: string
  detectedLanguage: string
}

export type EntityType = 'pattern' | 'list' | 'system'

export interface EntityPrediction {
  name: string
  type: string // ex: ['custom.list.fruits', 'system.time']
  value: string
  confidence: number
  source: string
  start: number
  end: number
  unit?: string
}

export interface ContextPrediction {
  name: string
  oos: number
  confidence: number
  intents: IntentPrediction[]
}

export interface IntentPrediction {
  name: string
  confidence: number
  slots: SlotPrediction[]
  extractor: string
}

export interface SlotPrediction {
  name: string
  value: string
  confidence: number
  source: string
  start: number
  end: number
  entity: EntityPrediction | null
}

/**
 * done : when a training is complete
 * training-pending : when a training was launched, but the training process is not started yet
 * training: when a chatbot is currently training
 * canceled: when a training was canceled
 * errored: when a chatbot failed to train
 */
export type TrainingStatus = 'done' | 'training-pending' | 'training' | 'canceled' | 'errored'

export interface TrainingSession {
  key: string
  status: TrainingStatus
  language: string
  progress: number
}

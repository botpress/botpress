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

/**
 * #################################
 * ############ ENGINE #############
 * #################################
 */
export interface TrainingSession {
  key: string
  status: TrainingStatus
  language: string
  progress: number
}

export interface EntityDefOccurrence {
  name: string
  synonyms: string[]
}

export interface EntityDefinition {
  id: string
  name: string
  type: EntityType
  sensitive?: boolean
  matchCase?: boolean
  examples?: string[]
  fuzzy?: number
  occurrences?: EntityDefOccurrence[]
  pattern?: string
}

export interface SlotDefinition {
  id: string
  name: string
  entities: string[]
  color: number
}

export interface Intent {
  name: string
  confidence: number
  context: string
}

export interface Entity {
  name: string
  type: string
  meta: EntityMeta
  data: EntityBody
}

export interface EntityBody {
  extras?: any
  value: any
  unit: string
}

export interface EntityMeta {
  sensitive: boolean
  confidence: number
  provider?: string
  source: string
  start: number
  end: number
  raw?: any
}

export interface Slot {
  name: string
  value: any
  source: any
  entity: Entity
  confidence: number
  start: number
  end: number
}

export interface SlotCollection {
  [key: string]: Slot
}

export interface Predictions {
  [context: string]: ContextPrediction
}

// Typings for Stan's API v1

/**
 * ################################
 * ############ INPUTS ############
 * ################################
 */
export interface TrainInput {
  language: string
  contexts: ContextDefinition[]
  entities: (ListEntityDefinition | PatternEntityDefinition)[]
  password: string
  seed?: number
}

export interface ContextDefinition {
  name: string
  intents: IntentDefinition[]
}

export interface IntentDefinition {
  name: string
  slots: SlotDefinition[]
  utterances: string[]
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

export interface EntityPrediction {
  name: string
  type: 'pattern' | 'list' | 'system'
  value: string
  confidence: number
  source: string
  start: number
  end: number
  unit?: string
}

export interface ContextPrediction {
  name: string
  confidence: number
  intents: IntentPrediction[]
}

export interface IntentPrediction {
  name: string
  confidence: number
  slots: SlotPrediction[]
  extractor: 'exact-matcher' | 'classifier'
}

export interface SlotPrediction {
  name: string
  value: string
  confidence: number
  source: string
  start: number
  end: number
  entity: EntityPrediction
}

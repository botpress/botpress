// Typings for Stan's API v1

export namespace http {
  export interface Credentials {
    appId: string
    appSecret: string
  }

  export interface TrainRequestBody extends Credentials {
    language: string
    contexts: string[]
    intents: IntentDefinition[]
    entities: EntityDefinition[]
    seed?: number
  }

  export interface PredictRequestBody extends Credentials {
    utterances: string[]
  }

  export interface DetectLangRequestBody extends PredictRequestBody {
    models: string[]
  }

  export interface ErrorResponse {
    success: false
    error: string
  }

  export interface SuccessReponse {
    success: true
  }

  export interface InfoResponseBody extends SuccessReponse {
    info: {
      specs: Specifications
      health: Health
      languages: string[]
    }
  }

  export interface TrainResponseBody extends SuccessReponse {
    modelId: string
  }

  export interface TrainProgressResponseBody extends SuccessReponse {
    session: TrainingProgress
  }

  export interface ListModelsResponseBody extends SuccessReponse {
    models: string[]
  }

  export interface PruneModelsResponseBody extends SuccessReponse {
    models: string[]
  }

  export interface PredictResponseBody extends SuccessReponse {
    predictions: PredictOutput[]
  }

  export interface DetectLangResponseBody extends SuccessReponse {
    detectedLanguages: string[]
  }
}

export interface Specifications {
  nluVersion: string // semver string
  languageServer: {
    dimensions: number
    domain: string
    version: string // semver string
  }
}

export interface Health {
  isEnabled: boolean
  validProvidersCount: number
  validLanguages: string[]
}

/**
 * ##################################
 * ############ TRAINING ############
 * ##################################
 */

export interface TrainInput {
  language: string
  intents: IntentDefinition[]
  entities: EntityDefinition[]
  seed: number
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

  sensitive?: boolean
}

export interface PatternEntityDefinition {
  name: string
  type: 'pattern'
  regex: string
  case_sensitive: boolean
  examples: string[]

  sensitive?: boolean
}

export type EntityDefinition = ListEntityDefinition | PatternEntityDefinition

/**
 * done : when a training is complete
 * training-pending : when a training was launched, but the training process is not started yet
 * training: when a chatbot is currently training
 * canceled: when a training was canceled
 * errored: when an unhandled error occured during training
 *
 * If the training does not exist, API returns a 404
 */
export type TrainingStatus = 'done' | 'training-pending' | 'training' | 'canceled' | 'errored'

export type TrainingErrorType = 'already-started' | 'unknown'
export interface TrainingError {
  type: TrainingErrorType
  message: string
  stackTrace?: string
}
export interface TrainingProgress {
  status: TrainingStatus
  progress: number
  error?: TrainingError
}

/**
 * ####################################
 * ############ PREDICTION ############
 * ####################################
 */
export interface PredictOutput {
  entities: EntityPrediction[]
  contexts: ContextPrediction[]
  spellChecked: string
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

  sensitive?: boolean
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

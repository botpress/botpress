/**
 * This is the SDK of internal module "nlu-core".
 * It is meant to insulate users from changes in types occuring inside our nlu.
 */
declare module 'botpress/nlu' {
  export namespace errors {
    export const isTrainingCanceled: (err: Error) => boolean
    export const isTrainingAlreadyStarted: (err: Error) => boolean
  }

  export const makeEngine: (config: Config, logger: Logger) => Promise<Engine>

  export interface Config extends LanguageConfig {
    modelCacheSize: number
  }

  export interface LanguageConfig {
    ducklingURL: string
    ducklingEnabled: boolean
    languageSources: LanguageSource[]
  }

  export interface LanguageSource {
    endpoint: string
    authToken?: string
  }

  export interface Logger {
    debug: (msg: string) => void
    info: (msg: string) => void
    warning: (msg: string, err?: Error) => void
    error: (msg: string, err?: Error) => void
  }

  export type EntityType = 'system' | 'pattern' | 'list'

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

  export interface IntentDefinition {
    name: string
    utterances: {
      [lang: string]: string[]
    }
    slots: SlotDefinition[]
    contexts: string[]
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

  export interface TrainingSet {
    intentDefs: IntentDefinition[]
    entityDefs: EntityDefinition[]
    languageCode: string
    seed: number // seeds random number generator in nlu training
  }

  export interface ModelIdArgs extends TrainingSet {
    specifications: Specifications
  }

  export interface TrainingOptions {
    progressCallback: (x: number) => void
    previousModel: ModelId | undefined
  }

  export interface ContextPrediction {
    confidence: number
    oos: number
    intents: {
      label: string
      confidence: number
      slots: Dic<Slot>
      extractor: string
    }[]
  }

  export interface Predictions {
    [context: string]: ContextPrediction
  }

  export interface PredictOutput {
    entities: Entity[]
    predictions: Predictions
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

  export interface Engine {
    getHealth: () => Health
    getLanguages: () => string[]
    getSpecifications: () => Specifications

    loadModel: (model: Model) => Promise<void>
    unloadModel: (modelId: ModelId) => void
    hasModel: (modelId: ModelId) => boolean

    train: (trainSessionId: string, trainSet: TrainingSet, options?: Partial<TrainingOptions>) => Promise<Model>
    cancelTraining: (trainSessionId: string) => Promise<void>

    detectLanguage: (text: string, modelByLang: Dic<ModelId>) => Promise<string>
    predict: (text: string, modelId: ModelId) => Promise<PredictOutput>
    spellCheck: (sentence: string, modelId: ModelId) => Promise<string>
  }

  export const modelIdService: {
    toString: (modelId: ModelId) => string // to use ModelId as a key
    fromString: (stringId: string) => ModelId // to parse information from a key
    toId: (m: Model) => ModelId // keeps only minimal information to make an id
    isId: (m: string) => boolean
    makeId: (factors: ModelIdArgs) => ModelId
    briefId: (factors: Partial<ModelIdArgs>) => Partial<ModelId> // makes incomplete Id from incomplete information
  }

  export interface ModelId {
    specificationHash: string // represents the nlu engine that was used to train the model
    contentHash: string // represents the intent and entity definitions the model was trained with
    seed: number // number to seed the random number generators used during nlu training
    languageCode: string // language of the model
  }

  export interface Specifications {
    nluVersion: string // semver string
    languageServer: {
      dimensions: number
      domain: string
      version: string // semver string
    }
  }

  export type Model = ModelId & {
    startedAt: Date
    finishedAt: Date
    data: {
      input: string
      output: string
    }
  }

  export interface Health {
    isEnabled: boolean
    validProvidersCount: number
    validLanguages: string[]
  }
}

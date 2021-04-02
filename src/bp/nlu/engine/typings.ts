import { TrainingSession } from 'nlu/stan/typings_v1'

export interface Config extends LanguageConfig {
  modelCacheSize: string
  legacyElection: boolean
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
  callbackUrl: string // to prevent from storing train sessions in engine
  previousModel: ModelId | undefined
}

interface EngineInfo {
  specs: Specifications
  languages: string[]
  health: Health
}

export interface CurrentEngine {
  getHealth: () => Health
  getLanguages: () => string[]
  getSpecifications: () => Specifications

  loadModel: (model: Model) => Promise<void>
  unloadModel: (modelId: ModelId) => void
  hasModel: (modelId: ModelId) => boolean

  train: (trainSessionId: string, trainSet: TrainingSet, options?: Partial<TrainingOptions>) => Promise<Model>
  cancelTraining: (trainSessionId: string) => Promise<void>

  detectLanguage: (text: string, modelByLang: { [key: string]: ModelId }) => Promise<string>
  predict: (text: string, modelId: ModelId) => Promise<PredictOutput>
}

export interface CurrentStan {
  getInfo: () => { version: string }

  train: (trainSet: TrainingSet, password: string) => Promise<ModelId> // password is to prevent from needing authentification
  getTrainingStatus: (modelId: ModelId, password: string) => TrainingSession // we replace this by callback url
  cancelTraining: (modelId: ModelId, password: string) => Promise<void>

  predict: (text: string, modelId: ModelId, password: string) => Promise<PredictOutput>
}

/**
 * Roadmap:
 *
 * 1 - implement an S3 model repo in stan (for HA)
 * 2 - refactor the codebase to the new API (still in memory)
 * 3 - move to an HTTP API
 * 4 - separate binaries ?
 */

// Still an http API
export interface NewStan {
  info: () => EngineInfo // the full deal

  // Owner is the botId. We need this because multiple bots can use the same exact model. We need to prevent from deleting other bot's models.
  removeModels: (owner: string, modelId: Partial<ModelId>, password: string) => number // used when unmounting a bot, returns the amount deleted
  listModels: (owner: string, modelId: Partial<ModelId>, password: string) => ModelId[] // usefull to know if model is dirty and needs a training

  train: (
    owner: string,
    trainSet: TrainingSet,
    password: string,
    options?: Partial<TrainingOptions> // contains a callback url to prevent from storing train sessions in engine (for HA)
  ) => Promise<ModelId> // no model returned here as models are stored by engine
  cancelTraining: (owner: string, modelId: ModelId, password: string) => Promise<void>

  detectLanguage: (text: string, models: ModelId[], password: string) => Promise<string> // this method is not already in Stan, but need to be added
  predict: (text: string, modelId: ModelId, password: string) => Promise<PredictOutput>
}

/**
 * Open questions:
 * - what password to use ?
 * -
 */

// Ideally, this would be a yarn package to reuse both in Stan and
export interface ModelIdUtils {
  toString: (modelId: ModelId) => string
  fromString: (stringId: string) => ModelId
  isId: (m: string) => boolean

  /**
   * used by engine.train(), but also by the module to know if model is dirty.
   * We don't want to make a training just to know if an up-to-date model exist.
   */
  makeId: (factors: ModelIdArgs) => ModelId

  /**
   * used at predict time, when we can't find the actual model we're looking for, so we pick the latest with correct specs and language
   * this behavior is shitty and should be removed
   */
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

export interface Model {
  id: ModelId
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

export interface ContextPrediction {
  confidence: number
  oos: number
  intents: {
    label: string
    confidence: number
    slots: SlotCollection
    extractor: string
  }[]
}

export interface PredictOutput {
  readonly entities: Entity[]
  readonly predictions: Predictions
  readonly spellChecked: string
}

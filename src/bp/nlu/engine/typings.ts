import { IntentDefinition, EntityDefinition, EntityPrediction, ContextPrediction } from 'nlu/typings_v1'

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
  progressCallback: (x: number) => void
  previousModel: ModelId | undefined
}

export interface PredictOutput {
  entities: EntityPrediction[]
  contexts: ContextPrediction[]
  spellChecked: string
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

  detectLanguage: (text: string, modelByLang: { [key: string]: ModelId }) => Promise<string>
  predict: (text: string, modelId: ModelId) => Promise<PredictOutput>
}

export interface ModelIdService {
  toString: (modelId: ModelId) => string // to use ModelId as a key
  fromString: (stringId: string) => ModelId // to parse information from a key
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

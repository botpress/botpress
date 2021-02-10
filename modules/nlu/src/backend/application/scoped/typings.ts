import * as sdk from 'botpress/sdk'

export interface PruningOptions {
  toKeep: number
}

export interface ListingOptions {
  negateFilter: boolean
}

export interface TrainDefinitions {
  intentDefs: sdk.NLU.IntentDefinition[]
  entityDefs: sdk.NLU.EntityDefinition[]
}

export interface ModelRepository {
  initialize(): Promise<void>
  hasModel(modelId: sdk.NLU.ModelId): Promise<boolean>
  getModel(modelId: sdk.NLU.ModelId): Promise<sdk.NLU.Model | undefined>
  getLatestModel(query: Partial<sdk.NLU.ModelId>): Promise<sdk.NLU.Model | undefined>
  saveModel(model: sdk.NLU.Model): Promise<void | void[]>
  listModels(query: Partial<sdk.NLU.ModelId>, opt?: Partial<ListingOptions>): Promise<sdk.NLU.ModelId[]>
  pruneModels(models: sdk.NLU.ModelId[], opt?: Partial<PruningOptions>): Promise<void | void[]>
}

export type FileListener = (fileName: string) => Promise<void>

export interface DefinitionRepository {
  getTrainDefinitions(): Promise<TrainDefinitions>
  onFileChanged(listener: FileListener): sdk.ListenHandle
}

import { NLU } from 'botpress/sdk'

export abstract class ExternalEngine {
  public abstract train(modelHash: string, dataset: Dataset): CancellableOperation<void, void>
  public abstract predict(text: string, lang: string, includedContexts: string[]): Promise<PredictionResult>
}

interface CancellableOperation<TResult, TProgress> {
  readonly operationId: string
  completion: Promise<TResult>
  onProgress: (event: TProgress) => void
  cancel(): void
}

interface PredictionResult {}

export interface Dataset {
  defaultLanguage: string
  otherLanguages: string[]
  intents: NLU.IntentDefinition[]
  entities: NLU.EntityDefinition[]
}

export interface DialogflowConfig {
  enabled: boolean
  projectId: string
  serviceAccountEmail: string
  serviceAccountPrivateKey: string
}

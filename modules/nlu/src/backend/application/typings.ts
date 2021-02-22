import { IO, NLU } from 'botpress/sdk'

export type I<C> = {
  [k in keyof C]: C[k]
}

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

export type ProgressCallback = (p: number) => Promise<void>

export interface Trainer {
  train(language: string, progressCallback: ProgressCallback): Promise<NLU.ModelId>
  load(modelId: NLU.ModelId): Promise<void>
  cancelTraining(language: string): Promise<void>
}

export interface Predictor {
  predict(text: string, anticipatedLanguage?: string): Promise<EventUnderstanding>
}

export type EventUnderstanding = Omit<IO.EventUnderstanding, 'includedContexts' | 'detectedLanguage'> & {
  detectedLanguage?: string
}

export interface TrainingState {
  status: NLU.TrainingStatus
  progress: number
}

export interface TrainingId {
  botId: string
  language: string
}

export interface TrainingSession extends TrainingId, TrainingState {}

export interface TrainerService {
  getBot(botId: string): Trainer | undefined
}

export type TrainingListener = (ts: TrainingSession) => Promise<void>

export interface ReadonlyTrainingRepository {
  initialize(): Promise<void>

  has(id: TrainingId): Promise<boolean>
  get(id: TrainingId): Promise<TrainingState | undefined>
  query(query: Partial<TrainingSession>): Promise<TrainingSession[]>
  getAll(): Promise<TrainingSession[]>

  clear(): Promise<void> // not readonly, but thread safe
}

export interface TrainingRepository extends ReadonlyTrainingRepository {
  set(id: TrainingId, state: TrainingState): Promise<void>
}

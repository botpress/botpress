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
  owner: string
  modifiedOn: Date
}

export interface TrainingId {
  botId: string
  language: string
}

export interface TrainingSession extends TrainingId, TrainingState {}

export interface TrainerService {
  hasBot(botId: string): boolean
  getBot(botId: string): Trainer | undefined
}

export type TrainingListener = (ts: TrainingSession) => Promise<void>

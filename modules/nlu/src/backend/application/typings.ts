import { IO, NLU } from 'botpress/sdk'

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
  train(language: string, progressCallback: ProgressCallback): Promise<void>
  loadLatest(language: string): Promise<void>
  cancelTraining(language: string): Promise<void>
}

export interface Predictor {
  predict(text: string, anticipatedLanguage?: string): Promise<EventUnderstanding>
}

export type EventUnderstanding = Omit<IO.EventUnderstanding, 'includedContexts' | 'detectedLanguage'> & {
  detectedLanguage?: string
}

export interface TrainingId {
  botId: string
  language: string
}

export interface TrainerService {
  getBot(botId: string): Trainer | undefined
}

export interface TrainingQueue {
  initialize(): Promise<void>
  teardown(): Promise<void>

  needsTraining(trainId: TrainingId): Promise<void>
  queueTraining(trainId: TrainingId): Promise<void>
  cancelTraining(trainId: TrainingId): Promise<void>
  getTraining(trainId: TrainingId): Promise<NLU.TrainingSession>
}

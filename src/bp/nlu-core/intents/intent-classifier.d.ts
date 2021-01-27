import { Intent, ListEntityModel, PatternEntity } from 'nlu-core/typings'
import Utterance from 'nlu-core/utterance/utterance'

export interface IntentTrainInput {
  list_entities: ListEntityModel[]
  pattern_entities: PatternEntity[]
  intents: Intent<Utterance>[]
  nluSeed: number
}

export interface IntentPredictions {
  intents: { name: string; confidence: number }[]
}
export interface NoneableIntentPredictions extends IntentPredictions {
  oos: number
}

export interface IntentClassifier {
  train(trainInput: IntentTrainInput, progress: (p: number) => void): Promise<void>
  serialize(): string
  load(model: string): void
  predict(utterance: Utterance): Promise<IntentPredictions>
}
export interface NoneableIntentClassifier {
  predict(utterance: Utterance): Promise<NoneableIntentPredictions>
}

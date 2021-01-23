import { MLToolkit } from 'botpress/sdk'
import _ from 'lodash'
import { ExactMatchIndex } from 'nlu-core/training-pipeline'
import { Intent, ListEntityModel, PatternEntity, Tools } from 'nlu-core/typings'
import Utterance, { UtteranceToStringOptions } from 'nlu-core/utterance/utterance'

import { getIntentFeatures } from './intent-featurizer'

const NONE_INTENT = 'none'
const MIN_NB_UTTERANCES = 3

export const EXACT_MATCH_STR_OPTIONS: UtteranceToStringOptions = {
  lowerCase: true,
  onlyWords: true,
  slots: 'keep-value', // slot extraction is done in || with intent prediction
  entities: 'keep-name'
}

export interface TrainInput {
  list_entities: ListEntityModel[]
  pattern_entities: PatternEntity[]
  intents: Intent<Utterance>[]
  nluSeed: number
}

export interface IntentClassifierModel {
  svmModel: string | undefined
  exact_match_index: ExactMatchIndex
}

interface Entities {
  list_entities: ListEntityModel[]
  pattern_entities: PatternEntity[]
}

export const getCustomEntitiesNames = (
  list_entities: ListEntityModel[],
  pattern_entities: PatternEntity[]
): string[] => {
  return [...list_entities.map(e => e.entityName), ...pattern_entities.map(e => e.name)]
}

export const BuildExactMatchIndex = (intents: Intent<Utterance>[]): ExactMatchIndex => {
  return _.chain(intents)
    .filter(i => i.name !== NONE_INTENT)
    .flatMap(i =>
      i.utterances.map(u => ({
        utterance: u.toString(EXACT_MATCH_STR_OPTIONS),
        contexts: i.contexts,
        intent: i.name
      }))
    )
    .filter(({ utterance }) => !!utterance)
    .reduce((index, { utterance, contexts, intent }) => {
      index[utterance] = { intent, contexts }
      return index
    }, {} as ExactMatchIndex)
    .value()
}

type ExactMatchResult = MLToolkit.SVM.Prediction & { extractor: 'exact-matcher' }

export function findExactIntent(exactMatchIndex: ExactMatchIndex, utterance: Utterance): ExactMatchResult | undefined {
  const candidateKey = utterance.toString(EXACT_MATCH_STR_OPTIONS)
  const maybeMatch = exactMatchIndex[candidateKey]
  if (maybeMatch) {
    return { label: maybeMatch.intent, confidence: 1, extractor: 'exact-matcher' }
  }
}

export class IntentClassifier {
  private model: (IntentClassifierModel & Entities) | undefined
  private svm: MLToolkit.SVM.Predictor | undefined

  constructor(private tools: Tools) {}

  public async train(trainInput: TrainInput, progress: (p: number) => void): Promise<void> {
    const { list_entities, pattern_entities, intents, nluSeed } = trainInput

    const customEntities = getCustomEntitiesNames(list_entities, pattern_entities)

    const noneUtts = _.chain(intents)
      .filter(i => i.name === NONE_INTENT) // in case user defines a none intent we want to combine utterances
      .flatMap(i => i.utterances)
      .filter(u => u.tokens.filter(t => t.isWord).length >= 3)
      .value()

    const trainableIntents = intents.filter(i => i.name !== NONE_INTENT && i.utterances.length >= MIN_NB_UTTERANCES)

    const nAvgUtts = Math.ceil(_.meanBy(trainableIntents, i => i.utterances.length))

    const lo = this.tools.seededLodashProvider.getSeededLodash()

    const points = _.chain(trainableIntents)
      .thru(ints => [
        ...ints,
        {
          name: NONE_INTENT,
          utterances: lo
            .chain(noneUtts)
            .shuffle()
            .take(nAvgUtts * 2.5) // undescriptible magic n, no sens to extract constant
            .value()
        }
      ])
      .flatMap(i =>
        i.utterances.map(utt => ({
          label: i.name,
          coordinates: getIntentFeatures(utt, customEntities)
        }))
      )
      .filter(x => !x.coordinates.some(isNaN))
      .value()

    const exact_match_index = BuildExactMatchIndex(intents)

    if (points.length <= 0) {
      this.model = {
        svmModel: undefined,
        exact_match_index,
        list_entities,
        pattern_entities
      }
      progress(1)
      return
    }
    const svm = new this.tools.mlToolkit.SVM.Trainer()

    const seed = nluSeed
    const svmModel = await svm.train(points, { kernel: 'LINEAR', classifier: 'C_SVC', seed }, progress)

    this.model = {
      svmModel,
      exact_match_index,
      list_entities,
      pattern_entities
    }
  }

  public serialize(): IntentClassifierModel {
    if (!this.model) {
      throw new Error('Intent classifier must be trained before calling serialize')
    }
    return this.model
  }

  public load(model: IntentClassifierModel, entities: Entities): void {
    this.model = { ...model, ...entities }
    if (model.svmModel) {
      this.svm = new this.tools.mlToolkit.SVM.Predictor(model.svmModel)
    }
  }

  public async predict(utterance: Utterance): Promise<MLToolkit.SVM.Prediction[]> {
    if (!this.model) {
      throw new Error('Intent classifier must be either trained or a model must be loaded before calling predict')
    }
    const { list_entities, pattern_entities, exact_match_index } = this.model
    const customEntities = getCustomEntitiesNames(list_entities, pattern_entities)

    const preds: MLToolkit.SVM.Prediction[] = []

    if (this.svm) {
      const features = getIntentFeatures(utterance, customEntities)
      const predictions = await this.svm.predict(features)
      preds.push(...predictions)
    }

    const exactPred = findExactIntent(exact_match_index, utterance)
    if (exactPred) {
      const idxToRemove = preds.findIndex(p => p.label === exactPred.label)
      preds.splice(idxToRemove, 1)
      preds.unshift(exactPred)
    }

    return preds
  }
}

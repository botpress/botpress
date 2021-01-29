import { MLToolkit } from 'botpress/sdk'
import _ from 'lodash'
import { ListEntityModel, PatternEntity, Tools } from 'nlu-core/typings'
import Utterance from 'nlu-core/utterance/utterance'

import { BuildExactMatchIndex, ExactMatchIndex, findExactIntent } from './exact-matcher'
import { IntentClassifier, IntentPredictions, IntentTrainInput } from './intent-classifier'
import { getIntentFeatures } from './intent-featurizer'

export const MIN_NB_UTTERANCES = 3

export interface Model {
  svmModel: string | undefined
  exact_match_index: ExactMatchIndex
  list_entities: ListEntityModel[]
  pattern_entities: PatternEntity[]
}

export class BaseIntentClassifier implements IntentClassifier {
  private model: Model | undefined
  private svm: MLToolkit.SVM.Predictor | undefined

  constructor(private tools: Tools) {}

  public async train(trainInput: IntentTrainInput, progress: (p: number) => void): Promise<void> {
    const { list_entities, pattern_entities, intents, nluSeed } = trainInput

    const customEntities = this._getCustomEntitiesNames(list_entities, pattern_entities)

    const points = _.chain(intents)
      .flatMap(i =>
        i.utterances.map(utt => ({
          label: i.name,
          coordinates: getIntentFeatures(utt, customEntities)
        }))
      )
      .filter(x => !x.coordinates.some(isNaN))
      .value()

    const exact_match_index = BuildExactMatchIndex(intents)

    const allClasses = _(points)
      .map(p => p.label)
      .uniq()
      .value()

    if (points.length <= 0 || allClasses.length <= 1) {
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

  public serialize(): string {
    if (!this.model) {
      throw new Error('Intent classifier must be trained before calling serialize')
    }
    return JSON.stringify(this.model)
  }

  public load(serialized: string): void {
    const model = JSON.parse(serialized) // TODO: validate input
    if (model.svmModel) {
      this.svm = new this.tools.mlToolkit.SVM.Predictor(model.svmModel)
    }
    this.model = model
  }

  public async predict(utterance: Utterance): Promise<IntentPredictions> {
    if (!this.model) {
      throw new Error('Intent classifier must be either trained or a model must be loaded before calling predict')
    }

    const { list_entities, pattern_entities, exact_match_index } = this.model
    const customEntities = this._getCustomEntitiesNames(list_entities, pattern_entities)

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

    return {
      intents: preds.map(({ label, confidence }) => ({ name: label, confidence }))
    }
  }

  private _getCustomEntitiesNames(list_entities: ListEntityModel[], pattern_entities: PatternEntity[]) {
    return [...list_entities.map(e => e.entityName), ...pattern_entities.map(e => e.name)]
  }
}

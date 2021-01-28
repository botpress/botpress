import { MLToolkit } from 'botpress/sdk'
import _ from 'lodash'
import { ListEntityModel, PatternEntity, Tools } from 'nlu-core/typings'
import Utterance from 'nlu-core/utterance/utterance'

import { getCtxFeatures } from './context-featurizer'
import { IntentClassifier, IntentPredictions, IntentTrainInput } from './intent-classifier'

interface Model {
  svmModel: string | undefined
  intentNames: string[]
  list_entities: ListEntityModel[]
  pattern_entities: PatternEntity[]
}

interface Predictors {
  svm: MLToolkit.SVM.Predictor | undefined
  intentNames: string[]
  list_entities: ListEntityModel[]
  pattern_entities: PatternEntity[]
}

export class RootIntentClassifier implements IntentClassifier {
  private model: Model | undefined
  private predictors: Predictors | undefined

  constructor(private tools: Tools) {}

  async train(input: IntentTrainInput, progress: (p: number) => void): Promise<void> {
    const { list_entities, pattern_entities, intents } = input
    const customEntities = [...list_entities.map(e => e.entityName), ...pattern_entities.map(e => e.name)]

    const points = _(intents)
      .flatMap(({ utterances, name }) => {
        return utterances.map(utt => ({
          label: name,
          coordinates: getCtxFeatures(utt, customEntities)
        }))
      })
      .filter(x => x.coordinates.filter(isNaN).length === 0)
      .value()

    const classCount = _.uniq(points.map(p => p.label)).length
    if (points.length === 0 || classCount <= 1) {
      this.model = {
        svmModel: undefined,
        intentNames: intents.map(i => i.name),
        list_entities,
        pattern_entities
      }
      progress(1)
      return
    }

    const svm = new this.tools.mlToolkit.SVM.Trainer()

    const seed = input.nluSeed
    const model = await svm.train(points, { kernel: 'LINEAR', classifier: 'C_SVC', seed }, progress)

    this.model = {
      svmModel: model,
      intentNames: intents.map(i => i.name),
      list_entities,
      pattern_entities
    }
  }

  serialize(): string {
    return JSON.stringify(this.model)
  }

  load(serialized: string): void {
    const model: Model = JSON.parse(serialized) // TODO: validate input
    this.predictors = this._makePredictors(model)
    this.model = model
  }

  private _makePredictors(model: Model): Predictors {
    const { svmModel, intentNames, list_entities, pattern_entities } = model
    return {
      svm: svmModel ? new this.tools.mlToolkit.SVM.Predictor(svmModel) : undefined,
      intentNames,
      list_entities,
      pattern_entities
    }
  }

  async predict(utterance: Utterance): Promise<IntentPredictions> {
    if (!this.predictors) {
      if (!this.model) {
        throw new Error('Root classifier must be trained before you call predict on it.')
      }

      this.predictors = this._makePredictors(this.model)
    }

    const { svm, intentNames, pattern_entities, list_entities } = this.predictors
    if (!svm) {
      if (intentNames.length <= 0) {
        return {
          intents: []
        }
      }

      const confidence = 1 / intentNames.length
      return {
        intents: intentNames.map(ctx => ({ name: ctx, confidence }))
      }
    }

    const customEntities = this._getCustomEntitiesNames(list_entities, pattern_entities)
    const features = getCtxFeatures(utterance, customEntities)
    const preds = await svm.predict(features)

    return {
      intents: preds.map(({ label, confidence }) => ({ name: label, confidence }))
    }
  }

  private _getCustomEntitiesNames(list_entities: ListEntityModel[], pattern_entities: PatternEntity[]) {
    return [...list_entities.map(e => e.entityName), ...pattern_entities.map(e => e.name)]
  }
}

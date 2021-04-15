import { MLToolkit } from 'botpress/sdk'
import Joi, { validate } from 'joi'
import _ from 'lodash'
import { ModelLoadingError } from '../../errors'
import { Logger } from '../../typings'
import { ListEntityModel, PatternEntity, Tools } from '../typings'
import Utterance from '../utterance/utterance'

import { IntentClassifier, IntentPredictions, IntentTrainInput } from './intent-classifier'

type Featurizer = (u: Utterance, entities: string[]) => number[]
export interface Model {
  svmModel: string | undefined
  intentNames: string[]
  entitiesName: string[]
}

interface Predictors {
  svm: MLToolkit.SVM.Predictor | undefined
  intentNames: string[]
  entitiesName: string[]
}

const keys: Record<keyof Model, Joi.AnySchema> = {
  svmModel: Joi.string()
    .allow('')
    .optional(),
  intentNames: Joi.array()
    .items(Joi.string())
    .required(),
  entitiesName: Joi.array()
    .items(Joi.string())
    .required()
}
export const modelSchema = Joi.object()
  .keys(keys)
  .required()

export class SvmIntentClassifier implements IntentClassifier {
  private static _displayName = 'SVM Intent Classifier'
  private static _name = 'svm-classifier'

  private model: Model | undefined
  private predictors: Predictors | undefined

  constructor(private tools: Tools, private featurizer: Featurizer, private logger?: Logger) {}

  get name() {
    return SvmIntentClassifier._name
  }

  async train(input: IntentTrainInput, progress: (p: number) => void): Promise<void> {
    const { intents, nluSeed, list_entities, pattern_entities } = input

    const entitiesName = this._getEntitiesName(list_entities, pattern_entities)

    const points = _(intents)
      .flatMap(({ utterances, name }) => {
        return utterances.map(utt => ({
          label: name,
          coordinates: this.featurizer(utt, entitiesName)
        }))
      })
      .filter(x => x.coordinates.filter(isNaN).length === 0)
      .value()

    const classCount = _.uniqBy(points, p => p.label).length
    if (points.length === 0 || classCount <= 1) {
      this.logger?.debug('No SVM to train because there is less than two classes.')
      this.model = {
        svmModel: undefined,
        intentNames: intents.map(i => i.name),
        entitiesName
      }
      progress(1)
      return
    }

    const svm = new this.tools.mlToolkit.SVM.Trainer()

    const seed = nluSeed
    const svmModel = await svm.train(points, { kernel: 'LINEAR', classifier: 'C_SVC', seed }, progress)

    this.model = {
      svmModel,
      intentNames: intents.map(i => i.name),
      entitiesName
    }
  }

  serialize(): string {
    if (!this.model) {
      throw new Error(`${SvmIntentClassifier._displayName} must be trained before calling serialize.`)
    }
    return JSON.stringify(this.model)
  }

  async load(serialized: string): Promise<void> {
    try {
      const raw = JSON.parse(serialized)
      const model: Model = await validate(raw, modelSchema)
      this.predictors = this._makePredictors(model)
      this.model = model
    } catch (err) {
      throw new ModelLoadingError(SvmIntentClassifier._displayName, err)
    }
  }

  private _makePredictors(model: Model): Predictors {
    const { svmModel, intentNames, entitiesName } = model
    return {
      svm: svmModel ? new this.tools.mlToolkit.SVM.Predictor(svmModel) : undefined,
      intentNames,
      entitiesName
    }
  }

  async predict(utterance: Utterance): Promise<IntentPredictions> {
    if (!this.predictors) {
      if (!this.model) {
        throw new Error(`${SvmIntentClassifier._displayName} must be trained before calling predict.`)
      }

      this.predictors = this._makePredictors(this.model)
    }

    const { svm, intentNames, entitiesName } = this.predictors
    if (!svm) {
      if (intentNames.length <= 0) {
        return {
          intents: []
        }
      }

      const intent = intentNames[0]
      return {
        intents: [{ name: intent, confidence: 1, extractor: 'svm-classifier' }]
      }
    }

    const features = this.featurizer(utterance, entitiesName)
    const preds = await svm.predict(features)

    return {
      intents: preds.map(({ label, confidence }) => ({ name: label, confidence, extractor: 'svm-classifier' }))
    }
  }

  private _getEntitiesName(list_entities: ListEntityModel[], pattern_entities: PatternEntity[]) {
    return [...list_entities.map(e => e.entityName), ...pattern_entities.map(e => e.name)]
  }
}

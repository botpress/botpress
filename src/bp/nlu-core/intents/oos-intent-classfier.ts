import { MLToolkit } from 'botpress/sdk'
import _ from 'lodash'
import { isPOSAvailable } from 'nlu-core/language/pos-tagger'
import {
  featurizeInScopeUtterances,
  featurizeOOSUtterances,
  getUtteranceFeatures
} from 'nlu-core/out-of-scope-featurizer'
import { NONE_INTENT } from 'nlu-core/training-pipeline'
import { Intent, Tools } from 'nlu-core/typings'
import Utterance from 'nlu-core/utterance/utterance'

import { BaseIntentClassifier, MIN_NB_UTTERANCES } from './base-intent-classifier'
import { IntentTrainInput, NoneableIntentClassifier, NoneableIntentPredictions } from './intent-classifier'

interface TrainInput extends IntentTrainInput {
  allUtterances: Utterance[]
  noneIntent: Intent<Utterance>
}

interface Model {
  trainingVocab: string[]
  baseIntentClfModel: string
  oosSvmModel: string | undefined
}

interface Predictors {
  baseIntentClf: BaseIntentClassifier
  oosSvm: MLToolkit.SVM.Predictor | undefined
  trainingVocab: string[]
}

export class OOSIntentClassifier implements NoneableIntentClassifier {
  private model: Model | undefined
  private predictors: Predictors | undefined

  constructor(private tools: Tools) {}

  public async train(trainInput: TrainInput, progress: (p: number) => void): Promise<void> {
    const { noneIntent } = trainInput

    const [ooScopeModel, inScopeModel] = await Promise.all([
      this._trainOOScopeSvm(trainInput, noneIntent, (p: number) => progress(p / 2)),
      this._trainInScopeSvm(trainInput, noneIntent, (p: number) => progress(p / 2))
    ])

    this.model = {
      oosSvmModel: ooScopeModel,
      baseIntentClfModel: inScopeModel,
      trainingVocab: this.getVocab(trainInput.allUtterances)
    }
  }

  private async _trainOOScopeSvm(
    trainInput: TrainInput,
    noneIntent: Omit<Intent<Utterance>, 'contexts'>,
    progress: (p: number) => void
  ): Promise<string | undefined> {
    const { allUtterances, nluSeed, intents } = trainInput
    const { languageCode } = allUtterances[0]

    const trainingOptions: MLToolkit.SVM.SVMOptions = {
      c: [10], // so there's no grid search
      kernel: 'LINEAR',
      classifier: 'C_SVC',
      seed: nluSeed
    }

    const noneUtts = noneIntent.utterances

    if (!isPOSAvailable(languageCode) || noneUtts.length === 0) {
      progress(1)
      return
    }

    const vocab = this.getVocab(allUtterances)
    const oos_points = featurizeOOSUtterances(noneUtts, vocab, this.tools)

    const in_ctx_scope_points = _.chain(intents)
      .filter(i => i.name !== NONE_INTENT)
      .flatMap(i => featurizeInScopeUtterances(i.utterances, i.name))
      .value()

    const svm = new this.tools.mlToolkit.SVM.Trainer()

    const model = await svm.train([...in_ctx_scope_points, ...oos_points], trainingOptions, progress)
    return model
  }

  private async _trainInScopeSvm(
    trainInput: TrainInput,
    noneIntent: Omit<Intent<Utterance>, 'contexts'>,
    progress: (p: number) => void
  ): Promise<string> {
    const baseIntentClf = new BaseIntentClassifier(this.tools)
    const noneUtts = noneIntent.utterances.filter(u => u.tokens.filter(t => t.isWord).length >= 3)
    const trainableIntents = trainInput.intents.filter(
      i => i.name !== NONE_INTENT && i.utterances.length >= MIN_NB_UTTERANCES
    )
    const nAvgUtts = Math.ceil(_.meanBy(trainableIntents, i => i.utterances.length))

    const lo = this.tools.seededLodashProvider.getSeededLodash()

    trainInput.intents.push({
      name: NONE_INTENT,
      utterances: lo
        .chain(noneUtts)
        .shuffle()
        .take(nAvgUtts * 2.5) // undescriptible magic n, no sens to extract constant
        .value(),
      contexts: [...trainInput.intents[0].contexts],
      slot_definitions: []
    })

    await baseIntentClf.train(trainInput, progress)
    return baseIntentClf.serialize()
  }

  private getVocab(utts: Utterance[]) {
    return _.flatMap(utts, u => u.tokens.map(t => t.toString({ lowerCase: true })))
  }

  public serialize(): string {
    if (!this.model) {
      throw new Error('Intent classifier must be trained before calling serialize')
    }
    return JSON.stringify(this.model)
  }

  public load(serialized: string): void {
    const model: Model = JSON.parse(serialized) // TODO: validate input

    const { oosSvmModel, baseIntentClfModel, trainingVocab } = model

    const baseIntentClf = new BaseIntentClassifier(this.tools)
    baseIntentClf.load(baseIntentClfModel)

    this.predictors = {
      oosSvm: oosSvmModel ? new this.tools.mlToolkit.SVM.Predictor(oosSvmModel) : undefined,
      baseIntentClf,
      trainingVocab
    }
  }

  public async predict(utterance: Utterance): Promise<NoneableIntentPredictions> {
    if (!this.predictors) {
      throw new Error('Intent classifier must be either trained or a model must be loaded before calling predict')
    }

    const { oosSvm, baseIntentClf, trainingVocab } = this.predictors

    const intentPredictions = await baseIntentClf.predict(utterance)

    let oosPrediction = 0
    if (oosSvm) {
      const feats = getUtteranceFeatures(utterance, trainingVocab)
      try {
        const preds = await oosSvm.predict(feats)
        oosPrediction =
          _.chain(preds)
            .filter(p => p.label.startsWith('out'))
            .maxBy(p => p.confidence)
            .value()?.confidence || 0
      } catch (err) {}
    }

    // TODO: proceed to election between none intent and oos, remove none intent and make sure confidences sum to 1.

    return {
      ...intentPredictions,
      oos: oosPrediction
    }
  }
}

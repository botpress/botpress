import { MLToolkit } from 'botpress/sdk'
import Joi, { validate } from 'joi'
import _ from 'lodash'
import { ModelLoadingError } from '../../errors'
import { Logger } from '../../typings'
import { isPOSAvailable } from '../language/pos-tagger'
import { SMALL_TFIDF } from '../tools/tfidf'
import { isSpace, SPACE } from '../tools/token-utils'
import { Intent, Tools } from '../typings'
import Utterance, { buildUtteranceBatch } from '../utterance/utterance'

import { ExactIntenClassifier } from './exact-intent-classifier'
import { IntentTrainInput, NoneableIntentClassifier, NoneableIntentPredictions } from './intent-classifier'
import { getIntentFeatures } from './intent-featurizer'
import { featurizeInScopeUtterances, featurizeOOSUtterances, getUtteranceFeatures } from './out-of-scope-featurizer'
import { SvmIntentClassifier } from './svm-intent-classifier'

interface TrainInput extends IntentTrainInput {
  allUtterances: Utterance[]
}

export interface Model {
  trainingVocab: string[]
  baseIntentClfModel: string
  oosSvmModel: string | undefined
  exactMatchModel: string
}

interface Predictors {
  baseIntentClf: SvmIntentClassifier
  oosSvm: MLToolkit.SVM.Predictor | undefined
  trainingVocab: string[]
  exactIntenClassifier: ExactIntenClassifier
}

const MIN_NB_UTTERANCES = 3
const NONE_INTENT = 'none'
const NONE_UTTERANCES_BOUNDS = {
  MIN: 20,
  MAX: 200
}

export const modelSchema = Joi.object()
  .keys({
    trainingVocab: Joi.array()
      .items(Joi.string().allow(''))
      .required(),
    baseIntentClfModel: Joi.string()
      .allow('')
      .required(),
    oosSvmModel: Joi.string()
      .allow('')
      .optional(),
    exactMatchModel: Joi.string()
      .allow('')
      .required()
  })
  .required()

/**
 * @description Intent classfier composed of 3 smaller components:
 *  1 - an SVM intent classifier
 *  2 - an SVM to predict weither the sample is in scope or oos
 *  3 - an exact-matcher to override the prediction made by the SVM when there's an exact match
 *
 * @returns A confidence level for all possible labels including none
 */
export class OOSIntentClassifier implements NoneableIntentClassifier {
  private static _displayName = 'OOS Intent Classifier'
  private static _name = 'classifier'

  private model: Model | undefined
  private predictors: Predictors | undefined

  constructor(private tools: Tools, private logger?: Logger) {}

  get name() {
    return OOSIntentClassifier._name
  }

  public async train(trainInput: TrainInput, progress: (p: number) => void): Promise<void> {
    const { languageCode, allUtterances } = trainInput
    const noneIntent = await this._makeNoneIntent(allUtterances, languageCode)

    let ooScopeProgress = 0
    let inScopeProgress = 0
    const reportCombinedProgres = () => {
      const combinedProgres = (ooScopeProgress + inScopeProgress) / 2
      progress(combinedProgres)
    }

    const [ooScopeModel, inScopeModel] = await Promise.all([
      this._trainOOScopeSvm(trainInput, noneIntent, (p: number) => {
        ooScopeProgress = p
        reportCombinedProgres()
      }),
      this._trainInScopeSvm(trainInput, noneIntent, (p: number) => {
        inScopeProgress = p
        reportCombinedProgres()
      })
    ])

    const exactIntenClassifier = new ExactIntenClassifier()
    const dummyProgress = () => {}
    await exactIntenClassifier.train(trainInput, dummyProgress)
    const exactMatchModel = exactIntenClassifier.serialize()

    this.model = {
      oosSvmModel: ooScopeModel,
      baseIntentClfModel: inScopeModel,
      trainingVocab: this.getVocab(trainInput.allUtterances),
      exactMatchModel
    }
  }

  private _makeNoneIntent = async (allUtterances: Utterance[], languageCode: string): Promise<Intent<Utterance>> => {
    const allTokens = _.flatMap(allUtterances, u => u.tokens)

    const vocab = _(allTokens)
      .map(t => t.toString({ lowerCase: true }))
      .uniq()
      .value()

    const lo = this.tools.seededLodashProvider.getSeededLodash()

    const vocabWithDupes = lo(allTokens)
      .map(t => t.value)
      .flattenDeep<string>()
      .value()

    const junkWords = await this.tools.generateSimilarJunkWords(vocab, languageCode)
    const avgTokens = lo.meanBy(allUtterances, x => x.tokens.length)
    const nbOfNoneUtterances = lo.clamp(
      (allUtterances.length * 2) / 3,
      NONE_UTTERANCES_BOUNDS.MIN,
      NONE_UTTERANCES_BOUNDS.MAX
    )
    const stopWords = await this.tools.getStopWordsForLang(languageCode)
    const vocabWords = lo(allTokens)
      .filter(t => t.tfidf <= SMALL_TFIDF)
      .map(t => t.toString({ lowerCase: true }))
      .uniq()
      .orderBy(t => t)
      .value()

    // If 30% in utterances is a space, language is probably space-separated so we'll join tokens using spaces
    const joinChar = vocabWithDupes.filter(x => isSpace(x)).length >= vocabWithDupes.length * 0.3 ? SPACE : ''

    const vocabUtts = lo.range(0, nbOfNoneUtterances).map(() => {
      const nbWords = Math.round(lo.random(1, avgTokens * 2, false))
      return lo.sampleSize(lo.uniq([...stopWords, ...vocabWords]), nbWords).join(joinChar)
    })

    const junkWordsUtts = lo.range(0, nbOfNoneUtterances).map(() => {
      const nbWords = Math.round(lo.random(1, avgTokens * 2, false))
      return lo.sampleSize(junkWords, nbWords).join(joinChar)
    })

    const mixedUtts = lo.range(0, nbOfNoneUtterances).map(() => {
      const nbWords = Math.round(lo.random(1, avgTokens * 2, false))
      return lo.sampleSize([...junkWords, ...stopWords], nbWords).join(joinChar)
    })

    return <Intent<Utterance>>{
      name: NONE_INTENT,
      slot_definitions: [],
      utterances: await buildUtteranceBatch(
        [...mixedUtts, ...vocabUtts, ...junkWordsUtts, ...stopWords],
        languageCode,
        this.tools
      ),
      contexts: []
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
      this.logger?.debug('Cannot train OOS svm because there is no training data.')
      progress(1)
      return
    }

    const vocab = this.getVocab(allUtterances)
    const oos_points = featurizeOOSUtterances(noneUtts, vocab, this.tools)

    const in_scope_points = _.chain(intents)
      .filter(i => i.name !== NONE_INTENT)
      .flatMap(i => featurizeInScopeUtterances(i.utterances, i.name))
      .value()

    const svm = new this.tools.mlToolkit.SVM.Trainer()

    const model = await svm.train([...in_scope_points, ...oos_points], trainingOptions, progress)
    return model
  }

  private async _trainInScopeSvm(
    trainInput: TrainInput,
    noneIntent: Omit<Intent<Utterance>, 'contexts'>,
    progress: (p: number) => void
  ): Promise<string> {
    const baseIntentClf = new SvmIntentClassifier(this.tools, getIntentFeatures, this.logger)
    const noneUtts = noneIntent.utterances.filter(u => u.tokens.filter(t => t.isWord).length >= 3)
    const trainableIntents = trainInput.intents.filter(
      i => i.name !== NONE_INTENT && i.utterances.length >= MIN_NB_UTTERANCES
    )
    const nAvgUtts = Math.ceil(_.meanBy(trainableIntents, i => i.utterances.length))

    const lo = this.tools.seededLodashProvider.getSeededLodash()

    const intents: Intent<Utterance>[] = [
      ...trainableIntents,
      {
        name: NONE_INTENT,
        utterances: lo
          .chain(noneUtts)
          .shuffle()
          .take(nAvgUtts * 2.5) // undescriptible magic n, no sens to extract constant
          .value(),
        contexts: [],
        slot_definitions: []
      }
    ]

    await baseIntentClf.train({ ...trainInput, intents }, progress)
    return baseIntentClf.serialize()
  }

  private getVocab(utts: Utterance[]) {
    return _.flatMap(utts, u => u.tokens.map(t => t.toString({ lowerCase: true })))
  }

  public serialize(): string {
    if (!this.model) {
      throw new Error(`${OOSIntentClassifier._displayName} must be trained before calling serialize.`)
    }
    return JSON.stringify(this.model)
  }

  public async load(serialized: string): Promise<void> {
    try {
      const raw = JSON.parse(serialized)
      const model: Model = await validate(raw, modelSchema)
      this.predictors = await this._makePredictors(model)
      this.model = model
    } catch (err) {
      throw new ModelLoadingError(OOSIntentClassifier._displayName, err)
    }
  }

  private async _makePredictors(model: Model): Promise<Predictors> {
    const { oosSvmModel, baseIntentClfModel, trainingVocab, exactMatchModel } = model

    const baseIntentClf = new SvmIntentClassifier(this.tools, getIntentFeatures)
    await baseIntentClf.load(baseIntentClfModel)

    const exactMatcher = new ExactIntenClassifier()
    await exactMatcher.load(exactMatchModel)

    const exactIntenClassifier = new ExactIntenClassifier()
    await exactIntenClassifier.load(exactMatchModel)

    return {
      oosSvm: oosSvmModel ? new this.tools.mlToolkit.SVM.Predictor(oosSvmModel) : undefined,
      baseIntentClf,
      trainingVocab,
      exactIntenClassifier
    }
  }

  public async predict(utterance: Utterance): Promise<NoneableIntentPredictions> {
    if (!this.predictors) {
      if (!this.model) {
        throw new Error(`${OOSIntentClassifier._displayName} must be trained before calling predict.`)
      }

      this.predictors = await this._makePredictors(this.model)
    }

    const { oosSvm, baseIntentClf, trainingVocab, exactIntenClassifier } = this.predictors

    const svmPredictions = await baseIntentClf.predict(utterance)

    const exactPredictions = await exactIntenClassifier.predict(utterance)

    const intentPredictions = exactPredictions.oos
      ? svmPredictions.intents // no exact match
      : [...exactPredictions.intents, { name: NONE_INTENT, confidence: 0, extractor: exactIntenClassifier.name }]

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
      intents: intentPredictions,
      oos: oosPrediction
    }
  }
}

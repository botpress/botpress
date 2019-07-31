import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import math from 'mathjs'
import { VError } from 'verror'

import { GetZPercent } from '../../tools/math'
import { getProgressPayload, identityProgress } from '../../tools/progress'
import { Model, Token2Vec } from '../../typings'
import { enrichToken2Vec, getSentenceFeatures } from '../language/ft_featurizer'
import { sanitize } from '../language/sanitizer'
import { keepEntityValues } from '../slots/pre-processor'

import { LanguageProvider } from './../../typings'
import tfidf, { TfidfInput, TfidfOutput } from './tfidf'

const debug = DEBUG('nlu').sub('intents')
const debugTrain = debug.sub('train')
const debugPredict = debug.sub('predict')

const getPayloadForInnerSVMProgress = total => index => progress => ({
  value: 0.25 + Math.floor((progress * index) / (2 * total))
})

export default class SVMClassifier {
  private l0Predictor: sdk.MLToolkit.SVM.Predictor
  private l1PredictorsByContextName: { [key: string]: sdk.MLToolkit.SVM.Predictor } = {}
  private l0Tfidf: _.Dictionary<number>
  private l1Tfidf: { [context: string]: _.Dictionary<number> }
  private token2vec: Token2Vec

  constructor(
    private toolkit: typeof sdk.MLToolkit,
    private language: string,
    private languageProvider: LanguageProvider,
    private realtime: typeof sdk.realtime,
    private realtimePayload: typeof sdk.RealTimePayload
  ) {}

  private teardownModels() {
    this.l0Predictor = undefined
    this.l1PredictorsByContextName = {}
  }

  async load(models: Model[]) {
    const l0Model = models.find(x => x.meta.type === 'intent-l0' && x.meta.context === 'all')
    const l1Models = models.filter(x => x.meta.type === 'intent-l1')
    const tfidfModel = models.find(x => x.meta.type === 'intent-tfidf')

    if (!l0Model) {
      throw new Error('Could not find a Level-0 intent model')
    }

    if (!l1Models.length) {
      throw new Error('Could not find any Level-1 intent model')
    }

    if (!tfidfModel) {
      throw new Error('Could not find intents TFIDF model')
    }

    const { l0Tfidf, l1Tfidf, token2vec } = JSON.parse(tfidfModel.model.toString('utf8'))
    this.l0Tfidf = l0Tfidf
    this.l1Tfidf = l1Tfidf
    this.token2vec = token2vec

    Object.freeze(this.token2vec)

    if (_.uniqBy(l1Models, x => x.meta.context).length !== l1Models.length) {
      const ctx = l1Models.map(x => x.meta.context).join(', ')
      throw new Error(`You can't train different models with the same context. Ctx = [${ctx}]`)
    }

    const l0 = new this.toolkit.SVM.Predictor(l0Model.model.toString('utf8'))
    const l1: { [key: string]: sdk.MLToolkit.SVM.Predictor } = {}

    for (const model of l1Models) {
      l1[model.meta.context] = new this.toolkit.SVM.Predictor(model.model.toString('utf8'))
    }

    this.teardownModels()
    this.l0Predictor = l0
    this.l1PredictorsByContextName = l1
  }

  /**
   * Batches all utterances and tokenize+vectorize them in batch to populate the cache
   * This speeds up the tokenization during train and evaluation time without, while keeping the logic simple in those two methods
   */
  private async _primeLanguageCaches(intentDefs: sdk.NLU.IntentDefinition[]) {
    const utterances = _.flatten(intentDefs.map(intent => this._getSanitizedIntentUtterances(intent)))
    const tokens = await this.languageProvider.tokenize(utterances, this.language)
    await this.languageProvider.vectorize(_.flatten(tokens), this.language)
  }

  public async train(intentDefs: sdk.NLU.IntentDefinition[], modelHash: string): Promise<Model[]> {
    this.realtime.sendPayload(
      this.realtimePayload.forAdmins('statusbar.event', getProgressPayload(identityProgress)(0.1))
    )

    const allContexts = _.chain<sdk.NLU.IntentDefinition[]>(intentDefs)
      .flatMap(x => (<sdk.NLU.IntentDefinition>x).contexts)
      .uniq()
      .value()

    await this._primeLanguageCaches(intentDefs)
    const intentsWTokens = await Promise.mapSeries(
      intentDefs.filter(x => x.name !== 'none'),
      // we're generating none intents automatically from now on
      // but some existing bots might have the 'none' intent already created
      // so we exclude it explicitely from the dataset here
      async intent => {
        const utterances = this._getSanitizedIntentUtterances(intent)
        debugTrain('tokenizing intent ' + intent.name)
        const tokens = (await this.languageProvider.tokenize(utterances, this.language)).map(tokens =>
          tokens.map(sanitize)
        )
        return {
          ...intent,
          tokens: tokens
        }
      }
    )

    const token2vec: Token2Vec = {}

    const { l0Tfidf, l1Tfidf } = this.computeTfidf(intentsWTokens)

    const l0Points: sdk.MLToolkit.SVM.DataPoint[] = []
    const models: Model[] = []

    this.realtime.sendPayload(
      this.realtimePayload.forAdmins('statusbar.event', getProgressPayload(identityProgress)(0.2))
    )

    const ratioedProgress = getPayloadForInnerSVMProgress(allContexts.length)

    for (const [index, context] of Object.entries(allContexts)) {
      const intents = intentsWTokens.filter(x => x.contexts.includes(context))
      const utterances = _.flatten(intents.map(x => x.tokens))
      const vocabulary = _.flatten(utterances)

      // Vectorize all the vocabulary upfront to batch and cache it
      await this.languageProvider.vectorize(vocabulary, this.language)

      // Generate 'none' utterances for this context
      const junkWords = await this.languageProvider.generateSimilarJunkWords(vocabulary, this.language)
      const nbOfNoneUtterances = Math.max(5, utterances.length / 2) // minimum 5 none utterances per context, max 50% of the utterances set
      const averageWordCount = _.meanBy(utterances, x => x.length)
      const noneUtterances = _.range(0, nbOfNoneUtterances).map(() => {
        const nbWords = _.random(averageWordCount / 2, averageWordCount * 2, false)
        return _.sampleSize(junkWords, nbWords)
      })

      intents.push({
        contexts: [context],
        filename: 'none.json',
        name: 'none',
        slots: [],
        tokens: noneUtterances,
        utterances: { [this.language]: noneUtterances.map(utt => utt.join(' ')) }
      })

      const l1Points: sdk.MLToolkit.SVM.DataPoint[] = []

      for (const { name: intentName, tokens } of intents) {
        for (const utteranceTokens of tokens) {
          if (!utteranceTokens.length) {
            continue
          }

          if (intentName !== 'none') {
            await enrichToken2Vec(this.language, utteranceTokens, this.languageProvider, token2vec)
          }

          const l0Vec = await getSentenceFeatures({
            lang: this.language,
            doc: utteranceTokens,
            docTfidf: l0Tfidf[context],
            langProvider: this.languageProvider,
            token2vec: token2vec
          })

          const l1Vec = await getSentenceFeatures({
            lang: this.language,
            doc: utteranceTokens,
            docTfidf: l1Tfidf[context][intentName === 'none' ? '__avg__' : intentName],
            langProvider: this.languageProvider,
            token2vec: token2vec
          })

          if (intentName !== 'none') {
            // We don't want contexts to fit on l1-specific none intents
            l0Points.push({
              label: context,
              coordinates: [...l0Vec, utteranceTokens.length]
            })
          }

          l1Points.push({
            label: intentName,
            coordinates: [...l1Vec, utteranceTokens.length],
            utterance: utteranceTokens.join(' ')
          } as any)
        }
      }

      const svm = new this.toolkit.SVM.Trainer({ kernel: 'LINEAR', classifier: 'C_SVC' })

      const ratioedProgressForIndex = ratioedProgress(index)

      await svm.train(l1Points, progress => {
        this.realtime.sendPayload(
          this.realtimePayload.forAdmins('statusbar.event', getProgressPayload(ratioedProgressForIndex)(progress))
        )
        debugTrain('SVM => progress for INT', { context, progress })
      })

      const modelStr = svm.serialize()

      models.push({
        meta: { context, created_on: Date.now(), hash: modelHash, scope: 'bot', type: 'intent-l1' },
        model: new Buffer(modelStr, 'utf8')
      })
    }

    const svm = new this.toolkit.SVM.Trainer({ kernel: 'LINEAR', classifier: 'C_SVC' })
    await svm.train(l0Points, progress => debugTrain('SVM => progress for CTX %d', progress))
    const ctxModelStr = svm.serialize()

    models.push({
      meta: { context: 'all', created_on: Date.now(), hash: modelHash, scope: 'bot', type: 'intent-l0' },
      model: new Buffer(ctxModelStr, 'utf8')
    })

    models.push({
      meta: { context: 'all', created_on: Date.now(), hash: modelHash, scope: 'bot', type: 'intent-tfidf' },
      model: new Buffer(
        JSON.stringify({
          l0Tfidf: l0Tfidf['__avg__'],
          l1Tfidf: _.mapValues(l1Tfidf, x => x['__avg__']),
          token2vec: token2vec
        }),
        'utf8'
      )
    })

    return models
  }

  private _getSanitizedIntentUtterances(intent: sdk.NLU.IntentDefinition) {
    return (intent.utterances[this.language] || [])
      .map(x => sanitize(keepEntityValues(x.toLowerCase())))
      .filter(x => x.trim().length)
  }

  private computeTfidf(
    intentsWTokens: {
      tokens: string[][]
      name: string
      utterances: {
        [lang: string]: string[]
      }
      filename: string
      slots: sdk.NLU.SlotDefinition[]
      contexts: string[]
    }[]
  ): { l1Tfidf: { [context: string]: TfidfOutput }; l0Tfidf: TfidfOutput } {
    const allContexts = _.chain(intentsWTokens)
      .flatMap(x => x.contexts)
      .uniq()
      .value()

    const l0TfidfInput: TfidfInput = {}
    const l1Tfidf: {
      [context: string]: TfidfOutput
    } = {}

    for (const context of allContexts) {
      const intents = intentsWTokens.filter(x => x.contexts.includes(context))
      l0TfidfInput[context] = _.flatten(_.flatten(intents.map(x => x.tokens)))
      const l1Input: TfidfInput = {}
      for (const { name, tokens } of intents) {
        l1Input[name] = _.flatten(tokens)
      }
      l1Tfidf[context] = tfidf(l1Input)
    }
    const l0Tfidf: TfidfOutput = tfidf(l0TfidfInput)

    return { l0Tfidf, l1Tfidf }
  }

  // this means that the 3 best predictions are really close, do not change magic numbers
  private predictionsReallyConfused(predictions: sdk.MLToolkit.SVM.Prediction[]) {
    const intentsPreds = predictions.filter(x => x.label !== 'none')
    if (intentsPreds.length <= 2) {
      return false
    }

    const std = math.std(intentsPreds.map(p => p.confidence))
    const diff = (intentsPreds[0].confidence - intentsPreds[1].confidence) / std

    if (diff >= 2.5) {
      return false
    }

    const bestOf3STD = math.std(predictions.slice(0, 3).map(p => p.confidence))
    return bestOf3STD <= 0.03
  }

  public get isLoaded(): boolean {
    return !!Object.keys(this.l1PredictorsByContextName).length && !!this.l0Predictor
  }

  public async predict(tokens: string[], includedContexts: string[]): Promise<sdk.NLU.Intent[]> {
    if (!this.isLoaded) {
      throw new Error('No model loaded. Make sure you `load` your models before you call `predict`.')
    }

    if (!tokens.length) {
      return []
    }

    tokens = tokens.map(x => x.toLowerCase()) // make sure we're always lower-cased

    if (!includedContexts.length) {
      includedContexts = ['global']
    }

    const input = tokens.join(' ')

    const l0Vec = await getSentenceFeatures({
      lang: this.language,
      doc: tokens,
      docTfidf: this.l0Tfidf,
      langProvider: this.languageProvider,
      token2vec: this.token2vec
    })

    const l0Features = [...l0Vec, tokens.length]
    const l0 = await this.predictL0Contextually(l0Features, includedContexts)

    try {
      debugPredict('prediction request %o', { includedContexts, input })

      const predictions = _.flatten(
        await Promise.map(includedContexts, async ctx => {
          const l1Vec = await getSentenceFeatures({
            lang: this.language,
            doc: tokens,
            docTfidf: this.l1Tfidf[ctx],
            langProvider: this.languageProvider,
            token2vec: this.token2vec
          })

          const l1Features = [...l1Vec, tokens.length]
          const preds = await this.l1PredictorsByContextName[ctx].predict(l1Features)
          const l0Conf = _.get(l0.find(x => x.label === ctx), 'confidence', 0)

          if (preds.length <= 0) {
            return []
          }

          const firstBest = preds[0]
          if (preds.length === 1) {
            return [{ label: firstBest.label, l0Confidence: l0Conf, context: ctx, confidence: 1 }]
          }

          if (this.predictionsReallyConfused(preds)) {
            const others = _.take(preds, 4).map(x => ({
              label: x.label,
              l0Confidence: l0Conf,
              confidence: l0Conf * x.confidence
            }))
            return [{ label: 'none', l0Confidence: l0Conf, context: ctx, confidence: 1 }, ...others] // refine confidence
          }

          const secondBest = preds[1]
          const lnstd = math.std(preds.map(x => Math.log(x.confidence))) // because we want a lognormal distribution
          let p1Conf = GetZPercent((Math.log(firstBest.confidence) - Math.log(secondBest.confidence)) / lnstd)

          if (isNaN(p1Conf)) {
            p1Conf = 0.5
          }

          return [
            { label: firstBest.label, l0Confidence: l0Conf, context: ctx, confidence: l0Conf * p1Conf },
            { label: secondBest.label, l0Confidence: l0Conf, context: ctx, confidence: l0Conf * (1 - p1Conf) }
          ]
        })
      )

      debugPredict('predictions done %o', { includedContexts, input, predictions })

      return _.chain(predictions)
        .flatten()
        .orderBy('confidence', 'desc')
        .uniqBy(x => x.label)
        .map(x => ({ name: x.label, context: x.context, confidence: x.confidence }))
        .value()
    } catch (e) {
      throw new VError(e, `Error predicting intent for "${input}"`)
    }
  }

  private async predictL0Contextually(
    l0Features: number[],
    includedContexts: string[]
  ): Promise<sdk.MLToolkit.SVM.Prediction[]> {
    const allL0 = await this.l0Predictor.predict(l0Features)
    const includedL0 = allL0.filter(c => includedContexts.includes(c.label))
    const totalL0Confidence = Math.min(1, _.sumBy(includedL0, c => c.confidence))
    return includedL0.map(x => ({ ...x, confidence: x.confidence / totalL0Confidence }))
  }
}

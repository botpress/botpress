import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import math from 'mathjs'
import { VError } from 'verror'

import { GetZPercent } from '../../tools/math'
import { Model } from '../../typings'
import { getSentenceFeatures } from '../language/ft_featurizer'
import { generateNoneUtterances } from '../language/none-generator'
import { sanitize } from '../language/sanitizer'
import { keepEntityTypes } from '../slots/pre-processor'

import { LanguageProvider } from './../../typings'
import tfidf, { TfidfInput, TfidfOutput } from './tfidf'

const debug = DEBUG('nlu').sub('intents')
const debugTrain = debug.sub('train')
const debugPredict = debug.sub('predict')

const getPayloadForProgress = progress => ({
  type: 'nlu',
  name: 'training',
  value: 0.25 + Math.floor(progress / 2),
  working: true,
  message: 'Model is training'
})

// We might want to compute this as a function of the number of samples in each cluster
// As this depends on the dataset size and distribution
const MIN_CLUSTER_SAMPLES = 3

export default class SVMClassifier {
  private l0Predictor: sdk.MLToolkit.SVM.Predictor
  private l1PredictorsByContextName: { [key: string]: sdk.MLToolkit.SVM.Predictor } = {}
  private l0Tfidf: _.Dictionary<number>
  private l1Tfidf: { [context: string]: _.Dictionary<number> }

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

    const { l0Tfidf, l1Tfidf } = JSON.parse(tfidfModel.model.toString('utf8'))
    this.l0Tfidf = l0Tfidf
    this.l1Tfidf = l1Tfidf

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

  public async train(intentDefs: sdk.NLU.IntentDefinition[], modelHash: string): Promise<Model[]> {
    this.realtime.sendPayload(this.realtimePayload.forAdmins('statusbar.event', getPayloadForProgress(0)))

    const allContexts = _.chain<sdk.NLU.IntentDefinition[]>(intentDefs)
      .flatMap(x => (<sdk.NLU.IntentDefinition>x).contexts)
      .uniq()
      .value()

    const intentsWTokens = await Promise.all(
      intentDefs
        // we're generating none intents automatically from now on
        // but some existing bots might have the 'none' intent already created
        // so we exclude it explicitely from the dataset here
        .filter(x => x.name !== 'none')
        .map(async intent => ({
          ...intent,
          tokens: await Promise.all(
            (intent.utterances[this.language] || [])
              .map(x => keepEntityTypes(sanitize(x.toLowerCase())))
              .filter(x => x.trim().length)
              .map(async utterance => (await this.languageProvider.tokenize(utterance, this.language)).map(sanitize))
          )
        }))
    )

    const { l0Tfidf, l1Tfidf } = this.computeTfidf(intentsWTokens)
    const l0Points: sdk.MLToolkit.SVM.DataPoint[] = []
    const models: Model[] = []

    for (const context of allContexts) {
      const intents = intentsWTokens.filter(x => x.contexts.includes(context))
      const utterances = _.flatten(intents.map(x => x.tokens))
      const noneUtterances = generateNoneUtterances(utterances, Math.max(5, utterances.length / 2)) // minimum 5 none utterances per context
      intents.push({
        contexts: [context],
        filename: 'none.json',
        name: 'none',
        slots: [],
        tokens: noneUtterances,
        utterances: { [this.language]: noneUtterances.map(utt => utt.join('')) }
      })

      const l1Points: sdk.MLToolkit.SVM.DataPoint[] = []

      for (const { name: intentName, tokens } of intents) {
        for (const utteranceTokens of tokens) {
          if (utteranceTokens.length) {
            const l0Vec = await getSentenceFeatures(
              this.language,
              utteranceTokens,
              l0Tfidf[context],
              this.languageProvider
            )

            const l1Vec = await getSentenceFeatures(
              this.language,
              utteranceTokens,
              l1Tfidf[context][intentName === 'none' ? '__avg__' : intentName],
              this.languageProvider
            )

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
      }

      const svm = new this.toolkit.SVM.Trainer({ kernel: 'LINEAR', classifier: 'C_SVC' })

      await svm.train(l1Points, progress => {
        this.realtime.sendPayload(this.realtimePayload.forAdmins('statusbar.event', getPayloadForProgress(progress)))
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
        JSON.stringify({ l0Tfidf: l0Tfidf['__avg__'], l1Tfidf: _.mapValues(l1Tfidf, x => x['__avg__']) }),
        'utf8'
      )
    })

    return models
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
    const bestOf3STD = math.std(predictions.slice(0, 3).map(p => p.confidence))
    return predictions.length > 2 && bestOf3STD <= 0.03
  }

  public async predict(tokens: string[], includedContexts: string[]): Promise<sdk.NLU.Intent[]> {
    if (!Object.keys(this.l1PredictorsByContextName).length || !this.l0Predictor) {
      throw new Error('No model loaded. Make sure you `load` your models before you call `predict`.')
    }

    if (!tokens.length) {
      return []
    }

    const input = tokens.join(' ')

    const l0Vec = await getSentenceFeatures(this.language, tokens, this.l0Tfidf, this.languageProvider)
    const l0Features = [...l0Vec, tokens.length]
    const l0 = await this.l0Predictor.predict(l0Features)

    if (!includedContexts.length) {
      includedContexts = ['global']
    }

    try {
      debugPredict('prediction request %o', { includedContexts, input })

      const predictions = _.flatten(
        await Promise.map(includedContexts, async ctx => {
          const l1Vec = await getSentenceFeatures(this.language, tokens, this.l1Tfidf[ctx], this.languageProvider)
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
            return [{ label: 'none', l0Confidence: l0Conf, context: ctx, confidence: 1 }] // refine confidence
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
}

import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import math from 'mathjs'
import kmeans from 'ml-kmeans'
import { VError } from 'verror'

import { GetZPercent } from '../../tools/math'
import { Model } from '../../typings'
import FTWordVecFeaturizer from '../language/ft_featurizer'
import { sanitize } from '../language/sanitizer'
import { keepEntityTypes } from '../slots/pre-processor'

import { LanguageProvider } from './../../typings'
import tfidf, { TfidfInput, TfidfOutput } from './tfidf'

const debug = DEBUG('nlu').sub('intents')
const debugTrain = debug.sub('train')
const debugPredict = debug.sub('predict')

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
    private languageProvider: LanguageProvider
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
    const allContexts = _.chain<sdk.NLU.IntentDefinition[]>(intentDefs)
      .flatMap(x => (<sdk.NLU.IntentDefinition>x).contexts)
      .uniq()
      .value()

    const intentsWTokens = await Promise.all(
      intentDefs.map(async intent => ({
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
      const l1Points: sdk.MLToolkit.SVM.DataPoint[] = []

      for (const { name: intentName, tokens } of intents) {
        for (const utteranceTokens of tokens) {
          if (utteranceTokens.length) {
            const l0Vec = await FTWordVecFeaturizer.getFeatures(
              this.language,
              utteranceTokens,
              l0Tfidf[context],
              this.languageProvider
            )

            const l1Vec = await FTWordVecFeaturizer.getFeatures(
              this.language,
              utteranceTokens,
              l1Tfidf[context][intentName],
              this.languageProvider
            )

            l0Points.push({
              label: context,
              coordinates: [...l0Vec, utteranceTokens.length]
            })

            l1Points.push({
              label: intentName,
              coordinates: [...l1Vec, utteranceTokens.length]
            })
          }
        }
      }

      //////////////////////////////
      // split with k-means here
      //////////////////////////////

      const data = l1Points.map(x => x.coordinates)
      const nLabels = _.uniq(l1Points.map(x => x.label)).length

      let bestScore = 0
      let bestCluster: { [clusterId: number]: { [label: string]: number[][] } } = {}

      // TODO refine this logic here, maybe use a density based clustering or at least cluster step should be a func of our data
      for (
        let i = Math.min(Math.floor(nLabels / 2), l1Points.length) || 1;
        i < Math.min(nLabels, l1Points.length);
        i += 3
      ) {
        const km = kmeans(data, i)
        const clusters: { [clusterId: number]: { [label: string]: number[][] } } = {}

        l1Points.forEach(pts => {
          const r = km.nearest([pts.coordinates])[0] as number
          clusters[r] = clusters[r] || {}
          clusters[r][pts.label] = clusters[r][pts.label] || []
          clusters[r][pts.label].push(pts.coordinates)
        })

        const total = _.sum(_.map(clusters, c => _.max(_.map(c, y => y.length)))) / l1Points.length
        const score = total / Math.sqrt(i)

        if (score >= bestScore) {
          bestScore = score
          bestCluster = clusters
        }
      }

      const labelIncCluster: { [label: string]: number } = {}

      for (const pairs of _.values(bestCluster)) {
        const labels = Object.keys(pairs)
        for (const label of labels) {
          const samples = pairs[label]
          if (samples.length >= MIN_CLUSTER_SAMPLES) {
            labelIncCluster[label] = (labelIncCluster[label] || 0) + 1
            const newLabel = label + '__k__' + labelIncCluster[label]
            l1Points
              .filter(x => samples.includes(x.coordinates))
              .forEach(x => {
                x.label = newLabel
              })
          }
        }
      }

      //////////////////////////////
      //////////////////////////////

      const svm = new this.toolkit.SVM.Trainer()
      await svm.train(l1Points, progress => debugTrain('SVM => progress for INT', { context, progress }))
      const modelStr = svm.serialize()

      models.push({
        meta: { context, created_on: Date.now(), hash: modelHash, scope: 'bot', type: 'intent-l1' },
        model: new Buffer(modelStr, 'utf8')
      })
    }

    const svm = new this.toolkit.SVM.Trainer({ kernel: 'RBF', classifier: 'C_SVC' })
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

  public async predict(tokens: string[], includedContexts: string[]): Promise<sdk.NLU.Intent[]> {
    if (!Object.keys(this.l1PredictorsByContextName).length || !this.l0Predictor) {
      throw new Error('No model loaded. Make sure you `load` your models before you call `predict`.')
    }

    if (!tokens.length) {
      return []
    }

    const input = tokens.join(' ')

    const l0Vec = await FTWordVecFeaturizer.getFeatures(this.language, tokens, this.l0Tfidf, this.languageProvider)
    const l0Features = [...l0Vec, tokens.length]
    const l0 = await this.l0Predictor.predict(l0Features)

    if (!includedContexts.length) {
      includedContexts = ['global']
    }

    try {
      debugPredict('prediction request %o', { includedContexts, input })

      const predictions = _.flatten(
        await Promise.map(includedContexts, async ctx => {
          const l1Vec = await FTWordVecFeaturizer.getFeatures(
            this.language,
            tokens,
            this.l1Tfidf[ctx],
            this.languageProvider
          )
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

          const secondBest = preds[1]
          // because we want a lognormal distribution
          const std = math.std(preds.map(x => Math.log(x.confidence)))
          let p1Conf = GetZPercent((Math.log(firstBest.confidence) - Math.log(secondBest.confidence)) / std)

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

import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import tmp from 'tmp'

import { getProgressPayload } from '../../tools/progress'
import { LanguageProvider, NLUStructure, Token2Vec } from '../../typings'
import { Sequence, Token } from '../../typings'
import { TfidfOutput } from '../intents/tfidf'

import * as featurizer from './featurizer'
import * as labeler from './labeler'
import { generatePredictionSequence } from './pre-processor'

const debug = DEBUG('nlu').sub('slots')
const debugTrain = debug.sub('train')
const debugExtract = debug.sub('extract')
const debugVectorize = debug.sub('vectorize')

// TODO grid search / optimization for those hyperparams
const NUM_CLUSTERS = 8
const KMEANS_OPTIONS = {
  iterations: 250,
  initialization: 'random',
  seed: 666 // so training is consistent
} as sdk.MLToolkit.KMeans.KMeansOptions

const CRF_TRAINER_PARAMS = {
  c1: '0.0001',
  c2: '0.01',
  max_iterations: '500',
  'feature.possible_transitions': '1',
  'feature.possible_states': '1'
}

export default class CRFExtractor {
  private _isTrained: boolean = false
  private _crfModelFn = ''
  private _crfTagger!: sdk.MLToolkit.CRF.Tagger
  private _kmeansModel: sdk.MLToolkit.KMeans.KmeansResult

  constructor(
    private mlToolkit: typeof sdk.MLToolkit,
    private realtime: typeof sdk.realtime,
    private realtimePayload: typeof sdk.RealTimePayload,
    private languageProvider: LanguageProvider,
    private readonly language: string
  ) {}

  async load(traingingSet: Sequence[], crf: Buffer) {
    await this._trainKmeans(traingingSet) // retrain because we don't have access to KmeansResult class
    // load crf model
    this._crfModelFn = tmp.tmpNameSync()
    fs.writeFileSync(this._crfModelFn, crf)
    this._crfTagger = this.mlToolkit.CRF.createTagger()
    await this._crfTagger.open(this._crfModelFn)
    this._isTrained = true
  }

  async train(
    trainingSet: Sequence[],
    intentVocabs: { [token: string]: string[] },
    allowedEntitiesPerIntents: { [name: string]: string[] },
    tfidf: TfidfOutput,
    token2Vec: Token2Vec
  ): Promise<{ crf: Buffer }> {
    this._isTrained = false
    if (trainingSet.length >= 2) {
      debugTrain('start training')

      debugTrain('training kmeans')
      await this._trainKmeans(trainingSet)
      this.notifyTrainingProgress(0.33)

      debugTrain('training CRF')
      await this._trainCrf(trainingSet, intentVocabs, allowedEntitiesPerIntents, tfidf, token2Vec)
      this.notifyTrainingProgress(0.66)

      debugTrain('reading tagger')
      this._crfTagger = this.mlToolkit.CRF.createTagger()
      await this._crfTagger.open(this._crfModelFn)
      this._isTrained = true
      debugTrain('done training')
      this.notifyTrainingProgress(0.99)
      return {
        crf: await Promise.fromCallback(cb => fs.readFile(this._crfModelFn, cb))
      }
    } else {
      debugTrain('training set too small, skipping training')
      return {
        crf: undefined
      }
    }
  }

  async extract(
    ds: NLUStructure,
    intentDef: sdk.NLU.IntentDefinition,
    intentVocab,
    allowedEntities: string[],
    tfidf: TfidfOutput,
    token2Vec: Token2Vec
  ): Promise<sdk.NLU.SlotCollection> {
    if (!this._isTrained) {
      debugExtract('CRF not trained, skipping slot extraction', { text: ds.sanitizedLowerText })
      return {}
    }

    // TODO: Remove this line and make this part of the predictionPipeline instead
    const seq = await generatePredictionSequence(ds.rawText.toLowerCase(), intentDef, ds.entities, ds.tokens)
    const tagResults = await this._tag(seq, intentVocab, allowedEntities, tfidf, token2Vec)
    debugExtract('Tags for input', { tags: tagResults })

    return _.zip(seq.tokens, tagResults) // notice usage of zip here
      .filter(([token, tagRes]) => labeler.isTagAValidSlot(token, tagRes, intentDef))
      .reduce((slotCollection: any, [token, tag]) => {
        const slotDef = intentDef.slots.find(x => x.name == tag.name) // TODO review once we get the new utterance datastructure
        if (!slotDef) {
          return slotCollection
        }

        const slot = labeler.makeSlot(tag, token, slotDef, ds.entities)
        if (slot) {
          slotCollection[tag.name] = labeler.combineSlots(slotCollection[tag.name], token, tag, slot)
        }

        return slotCollection
      }, {})
  }

  // I simply moved stuff here
  // TODO implement this properly, dispatch progress event and let caller be responsible for this
  private notifyTrainingProgress(progress: number) {
    const crfPayloadProgress = (prog: number) => ({ value: 0.75 + Math.floor(prog / 4) })
    const createProgressPayload = getProgressPayload(crfPayloadProgress)

    this.realtime.sendPayload(this.realtimePayload.forAdmins('statusbar.event', createProgressPayload(progress)))
  }

  async _tag(
    seq: Sequence,
    intentVocab,
    allowedEntities: string[],
    tfidf: TfidfOutput,
    token2Vec: Token2Vec
  ): Promise<labeler.TagResult[]> {
    if (!this._isTrained) {
      throw new Error('Model not trained, please call train() before')
    }
    const inputFeatures = await Promise.map(seq.tokens, (t, i) =>
      this._getTokenSliceFeatures(seq, i, intentVocab, allowedEntities, tfidf, token2Vec, true)
    )
    debugVectorize('vectorize', { inputFeatures })

    return this._crfTagger.marginal(inputFeatures).map(labeler.predictionLabelToTagResult)
  }

  private async _trainKmeans(sequences: Sequence[]): Promise<any> {
    const tokens = _.chain(sequences)
      .flatMap(s => s.tokens)
      .map(t => t.canonical.toLowerCase())
      .value()

    if (_.isEmpty(tokens)) {
      return
    }

    const data = (await this.languageProvider.vectorize(tokens, this.language)).map(wordVec => Array.from(wordVec))
    const k = data.length > NUM_CLUSTERS ? NUM_CLUSTERS : 2

    try {
      this._kmeansModel = this.mlToolkit.KMeans.kmeans(data, k, KMEANS_OPTIONS)
    } catch (error) {
      throw Error(`Error training K-means model, error is: ${error}`)
    }
  }

  private async _trainCrf(
    trainingSet: Sequence[],
    intentVocab: { [token: string]: string[] },
    allowedEntitiesPerIntents: { [name: string]: string[] },
    tfidf: TfidfOutput,
    token2Vec: Token2Vec
  ) {
    this._crfModelFn = tmp.fileSync({ postfix: '.bin' }).name
    const trainer = this.mlToolkit.CRF.createTrainer()

    trainer.set_params(CRF_TRAINER_PARAMS)
    trainer.set_callback(str => debugTrain('CRFSUITE', str))

    for (const seq of trainingSet) {
      const inputFeatures = await Promise.map(seq.tokens, (t, i) =>
        this._getTokenSliceFeatures(seq, i, intentVocab, allowedEntitiesPerIntents[seq.intent], tfidf, token2Vec, false)
      )

      const labels = labeler.labelizeUtterance(seq)
      trainer.append(inputFeatures, labels)
    }

    trainer.train(this._crfModelFn)
  }

  private async _getTokenSliceFeatures(
    seq: Sequence,
    tokenIdx: number,
    intentVocab: { [token: string]: string[] },
    allowedEntities: string[],
    tfidf: TfidfOutput,
    token2Vec: Token2Vec,
    isPredict: boolean
  ): Promise<string[]> {
    const prev = await this._featurizeToken(
      seq.tokens[tokenIdx - 1],
      seq.intent,
      intentVocab,
      allowedEntities,
      tfidf,
      token2Vec,
      isPredict
    )

    const current = [
      featurizer.getIntentFeature(seq.intent),
      featurizer.getTokenQuartile(seq, tokenIdx),
      ...(await this._featurizeToken(
        seq.tokens[tokenIdx],
        seq.intent,
        intentVocab,
        allowedEntities,
        tfidf,
        token2Vec,
        isPredict
      ))
    ].filter(f => _.get(f, 'name') !== 'cluster')

    const next = await this._featurizeToken(
      seq.tokens[tokenIdx + 1],
      seq.intent,
      intentVocab,
      allowedEntities,
      tfidf,
      token2Vec,
      isPredict
    )

    const prevPairs = featurizer.getFeatPairs(prev, current, ['word', 'vocab', 'weight'])
    const nextPairs = featurizer.getFeatPairs(current, next, ['word', 'vocab', 'weight'])
    const eos = tokenIdx === seq.tokens.length - 1 ? ['__EOS__'] : []
    const bos = tokenIdx === 0 ? ['__BOS__'] : []

    return [
      ...bos,
      ...prev.map(featurizer.featToCRFsuiteAttr.bind(this, 'w[-1]')),
      ...current.map(featurizer.featToCRFsuiteAttr.bind(this, 'w[0]')),
      ...next.map(featurizer.featToCRFsuiteAttr.bind(this, 'w[1]')),
      ...prevPairs.map(featurizer.featToCRFsuiteAttr.bind(this, 'w[-1]|w[0]')),
      ...nextPairs.map(featurizer.featToCRFsuiteAttr.bind(this, 'w[0]|w[1]')),
      ...eos
    ] as string[]
  }

  private async _featurizeToken(
    token: Token,
    intentName: string,
    intentVocab: { [token: string]: string[] },
    allowedEntities: string[],
    tfidf: TfidfOutput,
    token2Vec: Token2Vec,
    isPredict: boolean
  ): Promise<featurizer.CRFFeature[]> {
    if (!token || !token.canonical) {
      return []
    }

    return [
      await featurizer.getClusterFeat(token, this.languageProvider, this._kmeansModel, this.language),
      await featurizer.getWordWeight(token, tfidf, this.languageProvider, token2Vec, this.language),
      featurizer.getWordFeat(token, isPredict),
      featurizer.getInVocabFeat(token, intentVocab, intentName),
      featurizer.getSpaceFeat(token),
      featurizer.getAlpha(token),
      featurizer.getNum(token),
      featurizer.getSpecialChars(token),
      ...featurizer.getEntitiesFeats(token, allowedEntities, isPredict)
    ].filter(_.identity) // some features can be undefined
  }
}

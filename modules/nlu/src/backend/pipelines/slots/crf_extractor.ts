import * as sdk from 'botpress/sdk'
import fs, { readFileSync } from 'fs'
import _ from 'lodash'
import tmp from 'tmp'

import { getProgressPayload } from '../../tools/progress'
import { SPACE } from '../../tools/token-utils'
import { LanguageProvider, NLUStructure, Token2Vec } from '../../typings'
import { BIO, Sequence, Token } from '../../typings'
import { TfidfOutput } from '../intents/tfidf'

import * as featurizer from './featurizer'
import { combineSlots, isTagAValidSlot, labelizeUtterance, makeSlot } from './labeler'
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

export type TagResult = { probability: number; label: string }

export default class CRFExtractor {
  private _isTrained: boolean = false
  private _crfModelFn = ''
  private _tagger!: sdk.MLToolkit.CRF.Tagger
  private _kmeansModel: sdk.MLToolkit.KMeans.KmeansResult

  constructor(
    private toolkit: typeof sdk.MLToolkit,
    private realtime: typeof sdk.realtime,
    private realtimePayload: typeof sdk.RealTimePayload,
    private languageProvider: LanguageProvider,
    private readonly language: string
  ) {}

  async load(traingingSet: Sequence[], crf: Buffer) {
    // load kmeans (retrain because there is no simple way to store it)
    await this._trainKmeans(traingingSet)

    // load crf model
    this._crfModelFn = tmp.tmpNameSync()
    fs.writeFileSync(this._crfModelFn, crf)
    this._tagger = this.toolkit.CRF.createTagger()
    await this._tagger.open(this._crfModelFn)
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
      this._tagger = this.toolkit.CRF.createTagger()
      await this._tagger.open(this._crfModelFn)
      this._isTrained = true
      debugTrain('done training')
      this.notifyTrainingProgress(0.99)
      return {
        crf: readFileSync(this._crfModelFn)
      }
    } else {
      debugTrain('training set too small, skipping training')
      return {
        crf: undefined
      }
    }
  }

  /**
   * Returns an object with extracted slots name as keys.
   * Each slots under each keys can either be a single Slot object or Array<Slot>
   * return value example:
   * slots: {
   *   artist: {
   *     name: "artist",
   *     value: "Kanye West",
   *     entity: [Object] // corresponding sdk.NLU.Entity
   *   },
   *   songs : [ multiple slots objects here]
   * }
   */
  async extract(
    ds: NLUStructure,
    intentDef: sdk.NLU.IntentDefinition,
    intentVocab,
    allowedEntitiesPerIntents,
    tfidf: TfidfOutput,
    token2Vec: Token2Vec
  ): Promise<sdk.NLU.SlotCollection> {
    debugExtract(ds.sanitizedLowerText, { entities: ds.entities })

    if (!this._isTrained) {
      debugExtract('CRF not trained, skipping slot extraction', { text: ds.sanitizedLowerText })
      return {}
    }

    // TODO: Remove this line and make this part of the predictionPipeline instead
    const seq = await generatePredictionSequence(ds.rawText.toLowerCase(), intentDef, ds.entities, ds.tokens)
    const tags = await this._tag(seq, intentVocab, allowedEntitiesPerIntents, tfidf, token2Vec)

    return _.zip(seq.tokens, tags) // notice usage of zip here
      .filter(([token, result]) => isTagAValidSlot(token, result, intentDef))
      .reduce((slotCollection: any, [token, tag]) => {
        // TODO review this once we get the new utterance datastructure
        const slotName = tag.label.slice(2)
        const slotDef = intentDef.slots.find(x => x.name == slotName)
        if (!slotDef) {
          return slotCollection
        }

        // TODO this will move away once we got the new utterance object
        const slot = makeSlot(slotName, token, slotDef, ds.entities, tag.probability)
        if (slot) {
          slotCollection[slotName] = combineSlots(slotCollection[slotName], token, tag, slot)
        }

        return slotCollection
      }, {})
  }

  // I simply moved stuff here
  // implement this properly, dispatch progress event and let caller be responsible for this
  private notifyTrainingProgress(progress: number) {
    const crfPayloadProgress = (prog: number) => ({
      value: 0.75 + Math.floor(prog / 4)
    })
    const createProgressPayload = getProgressPayload(crfPayloadProgress)

    this.realtime.sendPayload(this.realtimePayload.forAdmins('statusbar.event', createProgressPayload(progress)))
  }

  // TODO move this code in extracr
  async _tag(
    seq: Sequence,
    intentVocab,
    allowedEntitiesPerIntents,
    tfidf: TfidfOutput,
    token2Vec: Token2Vec
  ): Promise<TagResult[]> {
    if (!this._isTrained) {
      throw new Error('Model not trained, please call train() before')
    }
    const inputFeatures = await Promise.map(seq.tokens, (t, i) =>
      this._getTokenFeatures(seq, i, intentVocab, allowedEntitiesPerIntents[seq.intent], tfidf, token2Vec, true)
    )

    debugVectorize('vectorize', { inputFeatures })

    const probs = this._tagger.marginal(inputFeatures)
    // TODO extract and test this
    return probs.map(token =>
      _.chain(token)
        .toPairs()
        .maxBy('1')
        .thru(([label, prob]) => ({
          label: label.replace('/any', ''),
          probability: prob
        }))
        .value()
    )
  }

  // TODO remove this
  private _makeSlot(
    slotName: string,
    token: Token,
    slotDef: sdk.NLU.SlotDefinition,
    entities: sdk.NLU.Entity[],
    confidence: number
  ): sdk.NLU.Slot {
    const MIN_SLOT_CONFIDENCE = 0.1
    if (confidence < MIN_SLOT_CONFIDENCE) {
      return
    }

    const tokenSpaceOffset = token.value.startsWith(SPACE) ? 1 : 0
    const entity =
      slotDef &&
      entities.find(
        e =>
          slotDef.entities.indexOf(e.name) !== -1 &&
          e.meta.start <= token.start + tokenSpaceOffset &&
          e.meta.end >= token.end
      )

    // TODO: we might want to build up an entity with populated data with and 'any' slot
    if (slotDef && !slotDef.entities.includes('any') && !entity) {
      return
    }

    const value = _.get(entity, 'data.value', token.cannonical)
    const source = _.get(entity, 'meta.source', token.cannonical)

    const slot = {
      name: slotName,
      source,
      value,
      confidence
    } as sdk.NLU.Slot

    if (entity) {
      slot.entity = entity
    }

    return slot
  }

  private async _trainKmeans(sequences: Sequence[]): Promise<any> {
    // TODO use token.wordVector instead (once implemented)
    // const data = _.chain(sequences)
    //          .flatMap(s => s.tokens)
    //          .map(t => t.wordVector)\
    //          .value()

    const tokens = _.chain(sequences)
      .flatMap(s => s.tokens)
      .map(t => t.cannonical.toLowerCase())
      .value()

    if (_.isEmpty(tokens)) {
      return
    }

    const data = (await this.languageProvider.vectorize(tokens, this.language)).map(wordVec => Array.from(wordVec))
    const k = data.length > NUM_CLUSTERS ? NUM_CLUSTERS : 2

    try {
      this._kmeansModel = this.toolkit.KMeans.kmeans(data, k, KMEANS_OPTIONS)
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
    const trainer = this.toolkit.CRF.createTrainer()

    trainer.set_params(CRF_TRAINER_PARAMS)
    trainer.set_callback(str => debugTrain('CRFSUITE', str))

    for (const seq of trainingSet) {
      const inputFeatures = await Promise.map(seq.tokens, (t, i) =>
        this._getTokenFeatures(seq, i, intentVocab, allowedEntitiesPerIntents[seq.intent], tfidf, token2Vec, false)
      )

      const labels = labelizeUtterance(seq)
      trainer.append(inputFeatures, labels)
    }

    trainer.train(this._crfModelFn)
  }

  // move this in featurizer
  private async _getTokenFeatures(
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

  // move this in featurizer
  private async _featurizeToken(
    token: Token,
    intentName: string,
    intentVocab: { [token: string]: string[] },
    allowedEntities: string[],
    tfidf: TfidfOutput,
    token2Vec: Token2Vec,
    isPredict: boolean
  ): Promise<featurizer.CRFFeature[]> {
    if (!token || !token.cannonical) {
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

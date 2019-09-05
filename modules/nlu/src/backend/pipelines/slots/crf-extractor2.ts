import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import tmp from 'tmp'

import { Intent, Utterance, UtteranceToken } from '../../engine2'
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

export default class CRFExtractor2 {
  private _isTrained: boolean = false
  private _crfModelFn = ''
  private _crfTagger!: sdk.MLToolkit.CRF.Tagger
  private _kmeansModel: sdk.MLToolkit.KMeans.KmeansResult

  constructor(private mlToolkit: typeof sdk.MLToolkit) {}

  // async load(traingingSet: Sequence[], crf: Buffer) {
  //   await this._trainKmeans(traingingSet) // retrain because we don't have access to KmeansResult class
  //   // load crf model
  //   this._crfModelFn = tmp.tmpNameSync()
  //   fs.writeFileSync(this._crfModelFn, crf)
  //   this._crfTagger = this.mlToolkit.CRF.createTagger()
  //   await this._crfTagger.open(this._crfModelFn)
  //   this._isTrained = true
  // }

  async train(intents: Intent<Utterance>[]): Promise<{ crf: Buffer }> {
    this._isTrained = false
    if (intents.length < 2) {
      debugTrain('training set too small, skipping training')
      return {
        crf: undefined
      }
    }
    debugTrain('start training')
    intents = intents.filter(i => i.name !== 'none') // none intent is junk for slot tagger

    debugTrain('training kmeans')
    await this._trainKmeans(intents)

    debugTrain('training CRF')
    await this._trainCrf(intents)

    // debugTrain('reading tagger')
    // this._crfTagger = this.mlToolkit.CRF.createTagger()
    // await this._crfTagger.open(this._crfModelFn)
    // this._isTrained = true
    // debugTrain('done training')
    return {
      crf: undefined
    }
    // return {
    //   crf: await Promise.fromCallback(cb => fs.readFile(this._crfModelFn, cb))
    // }
  }

  private async _trainKmeans(intents: Intent<Utterance>[]): Promise<any> {
    const data = _.chain(intents)
      .flatMapDeep(i => i.utterances.map(u => u.tokens))
      .uniqBy((t: UtteranceToken) => t.value)
      .map((t: UtteranceToken) => t.vectors)
      .value() as number[][]

    if (_.isEmpty(data)) {
      return
    }

    const k = data.length > NUM_CLUSTERS ? NUM_CLUSTERS : 2

    this._kmeansModel = this.mlToolkit.KMeans.kmeans(data, k, KMEANS_OPTIONS)
  }

  private async _trainCrf(intents: Intent<Utterance>[]) {
    this._crfModelFn = tmp.fileSync({ postfix: '.bin' }).name
    const trainer = this.mlToolkit.CRF.createTrainer()

    trainer.set_params(CRF_TRAINER_PARAMS)
    trainer.set_callback(str => debugTrain('CRFSUITE', str))

    for (const intent of intents) {
      for (const utterance of intent.utterances) {
        // TODO you are here !!!
        // featurizing
        // labeling each utterance with the utterance class (currently testing this)

        // faetures
        // const inputFeatures = await Promise.map(intent., (t, i) =>
        //   this._getTokenSliceFeatures(intent, i, intentVocab, allowedEntitiesPerIntents[intent.intent], tfidf, token2Vec, false)
        // )

        const labels = labeler.labelizeUtterance2(utterance)

        trainer.append(inputFeatures, labels)
      }
    }

    // trainer.train(this._crfModelFn)
  }

  // private async _getTokenSliceFeatures(
  //   seq: Sequence,
  //   tokenIdx: number,
  //   intentVocab: { [token: string]: string[] },
  //   allowedEntities: string[],
  //   tfidf: TfidfOutput,
  //   token2Vec: Token2Vec,
  //   isPredict: boolean
  // ): Promise<string[]> {
  //   const prev = await this._featurizeToken(
  //     seq.tokens[tokenIdx - 1],
  //     seq.intent,
  //     intentVocab,
  //     allowedEntities,
  //     tfidf,
  //     token2Vec,
  //     isPredict
  //   )

  //   const current = [
  //     featurizer.getIntentFeature(seq.intent),
  //     featurizer.getTokenQuartile(seq, tokenIdx),
  //     ...(await this._featurizeToken(
  //       seq.tokens[tokenIdx],
  //       seq.intent,
  //       intentVocab,
  //       allowedEntities,
  //       tfidf,
  //       token2Vec,
  //       isPredict
  //     ))
  //   ].filter(f => _.get(f, 'name') !== 'cluster')

  //   const next = await this._featurizeToken(
  //     seq.tokens[tokenIdx + 1],
  //     seq.intent,
  //     intentVocab,
  //     allowedEntities,
  //     tfidf,
  //     token2Vec,
  //     isPredict
  //   )

  //   const prevPairs = featurizer.getFeatPairs(prev, current, ['word', 'vocab', 'weight'])
  //   const nextPairs = featurizer.getFeatPairs(current, next, ['word', 'vocab', 'weight'])
  //   const eos = tokenIdx === seq.tokens.length - 1 ? ['__EOS__'] : []
  //   const bos = tokenIdx === 0 ? ['__BOS__'] : []

  //   return [
  //     ...bos,
  //     ...prev.map(featurizer.featToCRFsuiteAttr.bind(this, 'w[-1]')),
  //     ...current.map(featurizer.featToCRFsuiteAttr.bind(this, 'w[0]')),
  //     ...next.map(featurizer.featToCRFsuiteAttr.bind(this, 'w[1]')),
  //     ...prevPairs.map(featurizer.featToCRFsuiteAttr.bind(this, 'w[-1]|w[0]')),
  //     ...nextPairs.map(featurizer.featToCRFsuiteAttr.bind(this, 'w[0]|w[1]')),
  //     ...eos
  //   ] as string[]
  // }

  // private async _featurizeToken(
  //   token: Token,
  //   intentName: string,
  //   intentVocab: { [token: string]: string[] },
  //   allowedEntities: string[],
  //   tfidf: TfidfOutput,
  //   token2Vec: Token2Vec,
  //   isPredict: boolean
  // ): Promise<featurizer.CRFFeature[]> {
  //   if (!token || !token.cannonical) {
  //     return []
  //   }

  //   return [
  //     await featurizer.getClusterFeat(token, this.languageProvider, this._kmeansModel, this.language),
  //     await featurizer.getWordWeight(token, tfidf, this.languageProvider, token2Vec, this.language),
  //     featurizer.getWordFeat(token, isPredict),
  //     featurizer.getInVocabFeat(token, intentVocab, intentName),
  //     featurizer.getSpaceFeat(token),
  //     featurizer.getAlpha(token),
  //     featurizer.getNum(token),
  //     featurizer.getSpecialChars(token),
  //     ...featurizer.getEntitiesFeats(token, allowedEntities, isPredict)
  //   ].filter(_.identity) // some features can be undefined
  // }
}

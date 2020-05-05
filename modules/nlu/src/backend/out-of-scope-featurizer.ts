import { MLToolkit } from 'botpress/sdk'

import { POSClass } from './language/pos-tagger'
import { averageVectors, scalarMultiply, zeroes } from './tools/math'
import { Token2Vec, Tools } from './typings'
import Utterance from './utterance/utterance'

export type POS_SET = POSClass[]
const POS1_SET: POS_SET = ['VERB', 'NOUN']
const POS2_SET: POS_SET = ['DET', 'PROPN', 'PRON', 'ADJ', 'AUX']
const POS3_SET: POS_SET = ['CONJ', 'CCONJ', 'INTJ', 'SCONJ', 'ADV']

const K_CLUSTERS = 3
const KMEANS_OPTIONS = {
  iterations: 250,
  initialization: 'random',
  seed: 666 // so training is consistent
} as MLToolkit.KMeans.KMeansOptions

function averageByPOS(utt: Utterance, posClasses: POS_SET) {
  const tokens = utt.tokens.filter(t => posClasses.includes(t.POS))
  const vectors = tokens.map(x => scalarMultiply(<number[]>x.vector, x.tfidf))
  if (!vectors.length) {
    return zeroes(utt.tokens[0].vector.length)
  }
  return averageVectors(vectors)
}

function countInVocab(utt: Utterance, vocab: Token2Vec) {
  return utt.tokens.reduce((sum, t) => {
    return sum + +!!vocab[t.toString({ lowerCase: true })]
  }, 0)
}

export function getUtteranceFeatures(utt: Utterance, vocab?: Token2Vec): number[] {
  const pos1 = averageByPOS(utt, POS1_SET)
  const pos2 = averageByPOS(utt, POS2_SET)
  const pos3 = averageByPOS(utt, POS3_SET)
  const inVocabRatio = vocab ? countInVocab(utt, vocab) / utt.tokens.length : 1

  const feats = [...pos1, ...pos2, ...pos3, utt.tokens.length, inVocabRatio]
  return feats
}

export function featurizeOOSUtterances(utts: Utterance[], vocab: Token2Vec, tools: Tools): MLToolkit.SVM.DataPoint[] {
  const noneEmbeddings = utts.map(u => getUtteranceFeatures(u, vocab))
  const kmeans = tools.mlToolkit.KMeans.kmeans(noneEmbeddings, K_CLUSTERS, KMEANS_OPTIONS)
  return noneEmbeddings.map(emb => ({
    label: `out_${kmeans.nearest([emb])[0]}`,
    coordinates: emb
  }))
}

export function featurizeInScopeUtterances(utts: Utterance[], intentName: string): MLToolkit.SVM.DataPoint[] {
  return utts.map(utt => ({
    label: intentName,
    coordinates: getUtteranceFeatures(utt)
  }))
}

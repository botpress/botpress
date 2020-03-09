import { MLToolkit } from 'botpress/sdk'

import { POSClass } from './language/pos-tagger'
import { averageVectors, scalarMultiply } from './tools/math'
import { Tools } from './typings'
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
    return new Array(utt.tokens[0].vector.length).fill(0)
  }
  return averageVectors(vectors)
}

export function getUtteranceFeatures(utt: Utterance): number[] {
  const pos1 = averageByPOS(utt, POS1_SET)
  const pos2 = averageByPOS(utt, POS2_SET)
  const pos3 = averageByPOS(utt, POS3_SET)
  const feats = [...pos1, ...pos2, ...pos3, utt.tokens.length]
  return feats
}

export function featurizeOOSUtterances(utts: Utterance[], tools: Tools): MLToolkit.SVM.DataPoint[] {
  const noneEmbeddings = utts.map(getUtteranceFeatures)
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

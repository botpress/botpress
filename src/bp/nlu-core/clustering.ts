import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import nearestVector from 'ml-nearest-vector'

import { euclideanDistanceSquared } from './tools/math'
import { Intent, SerializedKmeansResult, Tools } from './typings'
import Utterance, { UtteranceToken } from './utterance/utterance'

const NUM_CLUSTERS = 8
const KMEANS_OPTIONS = <sdk.MLToolkit.KMeans.KMeansOptions>{
  iterations: 250,
  initialization: 'random',
  seed: 666, // so training is consistent
  distanceFunction: euclideanDistanceSquared
}

const NONE_INTENT = 'none'

export const computeKmeans = (
  intents: Intent<Utterance>[],
  tools: Tools
): sdk.MLToolkit.KMeans.KmeansResult | undefined => {
  const data = _.chain(intents)
    .filter(i => i.name !== NONE_INTENT)
    .flatMap(i => i.utterances)
    .flatMap(u => u.tokens)
    .uniqBy((t: UtteranceToken) => t.value)
    .map((t: UtteranceToken) => t.vector)
    .value() as number[][]

  if (data.length < 2) {
    return
  }

  const k = data.length > NUM_CLUSTERS ? NUM_CLUSTERS : 2

  return tools.mlToolkit.KMeans.kmeans(data, k, KMEANS_OPTIONS)
}

export const serializeKmeans = (kmeans: sdk.MLToolkit.KMeans.KmeansResult): SerializedKmeansResult => {
  const { centroids, clusters, iterations } = kmeans
  return { centroids, clusters, iterations }
}

export const deserializeKmeans = (kmeans: SerializedKmeansResult): sdk.MLToolkit.KMeans.KmeansResult => {
  const { centroids, clusters, iterations } = kmeans
  const thisNearest = (data: sdk.MLToolkit.KMeans.DataPoint[]) => {
    return nearest(kmeans, data)
  }
  return { centroids, clusters, iterations, nearest: thisNearest }
}

/**
 * Copied from https://github.com/mljs/kmeans/blob/master/src/utils.js
 */
export const nearest = (kmeans: SerializedKmeansResult, data: sdk.MLToolkit.KMeans.DataPoint[]) => {
  const clusterID: number[] = new Array(data.length)
  const centroids = kmeans.centroids.map(c => c.centroid)

  for (let i = 0; i < data.length; i++) {
    clusterID[i] = nearestVector(centroids, data[i], {
      distanceFunction: euclideanDistanceSquared
    })
  }

  return clusterID
}

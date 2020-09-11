import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { distance, similarity } from 'ml-distance'
import { Matrix } from 'ml-matrix'
import { PCA } from 'ml-pca'

import { BotState } from '../backend/typings'

const clustering = require('density-clustering')

export async function computeEmbeddingSimilarity(state: BotState) {
  const intentDatas = _.groupBy(state.trainDatas, 'intent')

  const intentEmb = {}
  for (const key in intentDatas) {
    if (Object.prototype.hasOwnProperty.call(intentDatas, key)) {
      const meanEmb = intentDatas[key]
        .map(o => o.utt_emb)
        .reduce((tot, cur) => {
          return Matrix.add(tot, new Matrix([cur]))
        }, Matrix.zeros(1, intentDatas[key][0].utt_emb.length))

      intentEmb[key] = Matrix.div(meanEmb, intentDatas[key].length).to1DArray()
    }
  }

  const indexAndIntent = Array.from(Object.keys(intentEmb).entries())
  const simMat = { matrix: [], labels: [] }
  for (const [index, key] of indexAndIntent) {
    const row = []

    for (const [indexTodo, keyTodo] of indexAndIntent) {
      if (index === indexTodo) {
        row.push(1)
      } else {
        row.push(_.round(similarity.cosine(intentEmb[key], intentEmb[keyTodo]), 2))
      }
    }

    simMat.labels.push(key)
    simMat.matrix.push(row)
  }

  const plotlyMatrixData = [
    {
      x: simMat.labels,
      y: simMat.labels,
      z: simMat.matrix,
      type: 'heatmap'
    }
  ]

  return plotlyMatrixData
}

export async function computeScatterEmbeddings(state: BotState, logger: sdk.Logger) {
  const pcaTrain = new PCA(state.trainDatas.map(o => o.utt_emb))
  const varianceTrain = pcaTrain.getExplainedVariance()

  logger.info(
    `Top 3 train variance ${varianceTrain.slice(0, 3).map(o => _.round(o, 2))} Accounting for ${_.round(
      _.sum(varianceTrain.slice(0, 3)),
      2
    )}%`
  )

  const groupedIntentsTrain = _.groupBy(state.trainDatas, 'intent')
  const traces = []

  Object.entries(groupedIntentsTrain).map(([k, v]: [string, any[]], i) =>
    traces.push({
      x: v.map(o => pcaTrain.predict([o.utt_emb]).get(0, 0)),
      y: v.map(o => pcaTrain.predict([o.utt_emb]).get(0, 1)),
      z: v.map(o => pcaTrain.predict([o.utt_emb]).get(0, 2)),
      mode: 'markers',
      type: 'scatter3d',
      name: k,
      text: v.map(o => o.utt),
      marker: { size: 8, color: i }
    })
  )

  if (state.testDatas.length) {
    const pcaTest = new PCA(state.testDatas.map(o => o.utt_emb))
    const varianceTest = pcaTest.getExplainedVariance()

    logger.info(
      `Top 3 test variance ${varianceTest.slice(0, 3).map(o => _.round(o, 2))} Accounting for ${_.round(
        _.sum(varianceTest.slice(0, 3)),
        2
      )}%`
    )

    const groupedIntentsTest = _.groupBy(state.testDatas, 'intent')
    Object.entries(groupedIntentsTest).map(([k, v]: [string, any[]], i) =>
      traces.push({
        x: v.map(o => pcaTest.predict([o.utt_emb]).get(0, 0)),
        y: v.map(o => pcaTest.predict([o.utt_emb]).get(0, 1)),
        z: v.map(o => pcaTest.predict([o.utt_emb]).get(0, 2)),
        mode: 'markers',
        type: 'scatter3d',
        name: `${k}_test`,
        text: v.map(o => o.utt),
        marker: { size: 8, color: i }
      })
    )
  }

  return traces
}

function closest(a: number[], b: number[][], index: number): number {
  let minIndex = undefined
  let minDistance = 100000

  b.map((point, i) => {
    const dist = distance.euclidean(a, point)
    if (dist < minDistance && i !== index) {
      minIndex = i
      minDistance = dist
    }
  })

  return minDistance
}

export function computeOutliers(state: BotState) {
  const intentsData = _.groupBy(state.trainDatas, 'intent')
  const dbPerIntent = _.mapValues(intentsData, o => {
    const embedArray = o.map(e => e.utt_emb)
    const meanDist = o.reduce((sum, curr, index) => {
      if (index < o.length - 1) {
        return sum + closest(curr.utt_emb, embedArray, index)
      }
      return sum / o.length
    }, 0)

    const dbscan = new clustering.DBSCAN()
    // parameters: neighborhood radius, number of points in neighborhood to form a cluster
    const clusters = dbscan.run(embedArray, meanDist + 0.5 * meanDist, _.floor(o.length / 3))

    return {
      outliers: dbscan.noise.map(i => o[i].utt),
      clusters: clusters.map(indexList => indexList.map(i => o[i].utt))
    }
  })

  return dbPerIntent
}

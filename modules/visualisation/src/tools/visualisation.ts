import _ from 'lodash'
import { distance, similarity } from 'ml-distance'
import { Matrix } from 'ml-matrix'
import { PCA } from 'ml-pca'
import { BotState, PredRes } from '../backend/typings'

const clustering = require('density-clustering')

export async function computeConfusionMatrix(
  state: BotState,
  glob_res: { utt: string; acc: boolean; conf: number; pred: string; gt: string }[]
) {
  const results: PredRes[] = []
  for (const entry of state.testDatas) {
    const pred = await state.predictor.predict(entry.utt)
    results.push({
      utt: entry.utt,
      acc: pred.label === entry.intent,
      conf: pred.confidence,
      pred: pred.label,
      gt: entry.intent
    })

    glob_res.push({
      utt: entry.utt,
      acc: pred.label === entry.intent,
      conf: pred.confidence,
      pred: pred.label,
      gt: entry.intent
    })
  }

  console.log(
    'Total Accuracy : ',
    `${results.filter(o => o.acc).length}/${results.length} : ${results.filter(o => o.acc).length / results.length}`
  )
  await state.ghost.upsertFile('./datas/plop/results', 'confusion_matrix.json', JSON.stringify(results, undefined, 2))
  return results
}

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
  // console.log(intentEmb)

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
  await state.ghost.upsertFile('./datas/plop/results', 'similarity_matrix.json', JSON.stringify(simMat, undefined, 2))
  return plotlyMatrixData
}

export async function computeScatterEmbeddings(state: BotState) {
  const pca = new PCA(state.trainDatas.map(o => o.utt_emb))
  const variance = pca.getExplainedVariance()
  console.log(`Top 3 variance ${variance.slice(0, 3).map(o => _.round(o, 2))}`)
  console.log(`Accounting for ${_.round(_.sum(variance.slice(0, 3)), 2)}%`)
  const grouped_intents = _.groupBy(state.trainDatas, 'intent')
  const traces = []
  Object.entries(grouped_intents).map(([k, v]: [string, any[]], i) =>
    traces.push(
      {
        x: v.map(o => pca.predict([o.utt_emb]).get(0, 0)),
        y: v.map(o => pca.predict([o.utt_emb]).get(0, 1)),
        z: v.map(o => pca.predict([o.utt_emb]).get(0, 2)),
        mode: 'markers',
        type: 'scatter3d',
        name: k,
        text: v.map(o => o.utt),
        marker: { size: 8, color: i }
      }
      // {
      //   alphahull: 0,
      //   opacity: 0.05,
      //   type: 'mesh3d',
      //   color: i,
      //   name: k,
      //   x: v.map(o => pca.predict([o.utt_emb]).get(0, 0)),
      //   y: v.map(o => pca.predict([o.utt_emb]).get(0, 1)),
      //   z: v.map(o => pca.predict([o.utt_emb]).get(0, 2))
      // }
    )
  )
  return traces
}

// export async function computeTsneScatterEmbeddings(state: BotState) {
//   let output = []
//   if (await state.ghost.fileExists('./datas', 'tsne.json')) {
//     const outputString = await state.ghost.readFileAsString('./datas', 'tsne.json')
//     output = JSON.parse(outputString)
//   } else {
//     const model = new TSNE({
//       dim: 3,
//       perplexity: 10.0,
//       earlyExaggeration: 4.0,
//       learningRate: 100.0,
//       nIter: 1000,
//       metric: 'euclidean'
//     })
//     model.init({
//       data: state.trainDatas.map(o => o.utt_emb),
//       type: 'dense'
//     })

//     const [error, iter] = model.run()
//     output = model.getOutput()
//     await state.ghost.upsertFile('./datas', 'tsne.json', JSON.stringify(output, undefined, 2))
//   }
//   const traces = []
//   let c = 0
//   for (const intent of Object.keys(_.groupBy(state.trainDatas, 'intent'))) {
//     traces.push({
//       x: state.trainDatas.map((o, i) => {
//         if (o.intent === intent) {
//           return output[i][0]
//         }
//       }),
//       y: state.trainDatas.map((o, i) => {
//         if (o.intent === intent) {
//           return output[i][1]
//         }
//       }),
//       z: state.trainDatas.map((o, i) => {
//         if (o.intent === intent) {
//           return output[i][2]
//         }
//       }),
//       mode: 'markers',
//       type: 'scatter3d',
//       name: intent,
//       text: state.trainDatas.filter(o => o.intent === intent).map(o => o.utt),
//       marker: { size: 8, color: c }
//     })
//     c += 1
//   }
//   return traces
// }

export async function computeIntentSimilarity(state: BotState) {
  console.log('intent sim')
  console.log(state.trainDatas.length)
  const grouped_intents = _.groupBy(state.trainDatas, 'intent')
  const simMat = { matrix: [], labels: [], text: [] }
  for (const [intent, o] of Object.entries(grouped_intents)) {
    const rowMat = []
    const rowText = []
    for (const [intentTodo, oTodo] of Object.entries(grouped_intents)) {
      if (intent === intentTodo) {
        rowMat.push(0)
        rowText.push('')
      } else {
        let bestBadUttsText = []
        let bestBadUttsNb = 10000
        for (let i = 0; i < 10; i++) {
          const kmeans = new clustering.KMEANS()
          const [cluster1, cluster2] = kmeans.run(
            o.concat(oTodo).map(o => o.utt_emb),
            2
          )
          const clusterO = _.mean(cluster1) < _.mean(cluster2) ? cluster1 : cluster2
          const badUttsText = []
          let badUttsNb = 0
          o.map((p, i) => {
            if (!clusterO.includes(i)) {
              badUttsText.push(p.utt)
              badUttsNb += 1
            }
          })
          if (badUttsNb < bestBadUttsNb) {
            bestBadUttsNb = badUttsNb
            bestBadUttsText = badUttsText
          }
        }
        rowMat.push(bestBadUttsNb)
        rowText.push(bestBadUttsText.join('<br>'))
      }
    }
    simMat.labels.push(intent)
    simMat.matrix.push(rowMat)
    simMat.text.push(rowText)
  }
  const plotlyMatrixData = [
    {
      x: simMat.labels,
      y: simMat.labels,
      z: simMat.matrix,
      text: simMat.text,
      type: 'heatmap'
    }
  ]
  console.log('Done testing intents')
  return plotlyMatrixData
}

function arraySum(a: number[], b: number[]): number[] {
  return a.map((elt, i) => elt + b[i])
}

function arrayDiv(a: number[], b: number): number[] {
  return a.map(elt => elt / b)
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
  console.log('OUTLIERS')
  console.log(state.trainDatas.length)
  // const embedLen = state.trainDatas[0].utt_emb.length
  // const intentsData = _.groupBy(state.trainDatas, 'intent')
  // // const embedPerIntent = _.mapValues(intentsData, o => o.map(p => p.utt_emb))
  // const centroidPerIntent = _.mapValues(intentsData, o =>
  //   arrayDiv(
  //     o.reduce((sum, elt) => arraySum(elt.utt_emb, sum), new Array(embedLen).fill(0)),
  //     o.length
  //   )
  // )

  // const deviationToCenterPerIntent = _.mapValues(intentsData, (v, k) =>
  //   Math.sqrt(v.reduce((sum, elt) => distance.euclidean(elt.utt_emb, centroidPerIntent[k]), 0) / v.length)
  // )

  // const outliersPerIntent = _.mapValues(intentsData, (v, k) =>
  //   v
  //     .map(elt => {
  //       return { ...elt, dist: distance.euclidean(elt.utt_emb, centroidPerIntent[k]) }
  //     })
  //     .filter(elt => elt.dist > 3 * deviationToCenterPerIntent[k])
  // )

  // return { out: outliersPerIntent, dev: deviationToCenterPerIntent }
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
    // parameters: 5 - neighborhood radius, 2 - number of points in neighborhood to form a cluster
    const clusters = dbscan.run(embedArray, meanDist + 0.5 * meanDist, _.floor(o.length / 3))

    return {
      outliers: dbscan.noise.map(i => o[i].utt),
      clusters: clusters.map(indexList => indexList.map(i => o[i].utt))
    }
  })
  return dbPerIntent
}

// const CM2 = ConfusionMatrix.fromLabels(
//   glob_res.map(o => o.gt),
//   glob_res.map(o => o.pred)
// )
// // Normalize the confusion matrix
// const CM = new Matrix(CM2.matrix)
// CM2.matrix = CM.divColumnVector(CM2.matrix.map(row => _.sum(row) + 0.01)).to2DArray()

// const plotlyMatrixData = [
//   {
//     x: CM2.labels,
//     y: CM2.labels,
//     z: CM2.matrix,
//     type: 'heatmap'
//   }
// ]

// const layout = {
//   title: 'ConfusionMatrix',
//   annotations: [],
//   xaxis: {
//     ticks: '',
//     side: 'top'
//   },
//   yaxis: {
//     tickangle: -90,
//     ticks: '',
//     ticksuffix: ' ',
//     width: 700,
//     height: 700,
//     autosize: false
//   }
// }

// for (let i = 0; i < CM2.labels.length; i++) {
//   for (let j = 0; j < CM2.labels.length; j++) {
//     const result = {
//       xref: 'x1',
//       yref: 'y1',
//       x: CM2.labels[j],
//       y: CM2.labels[i],
//       text: CM2.matrix[i][j],
//       font: {
//         family: 'Arial',
//         size: 12,
//         color: 'rgb(50, 171, 96)'
//       },
//       showarrow: false
//     }
//     layout.annotations.push(result)
//   }
// }

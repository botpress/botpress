import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ConfusionMatrix from 'ml-confusion-matrix'
import { Matrix } from 'ml-matrix'
import nanoid from 'nanoid'

import { getTrainTestDatas } from '../tools/data_loader'
import {
  computeConfusionMatrix,
  computeEmbeddingSimilarity,
  computeIntentSimilarity,
  computeOutliers,
  computeScatterEmbeddings,
  computeTsneScatterEmbeddings
} from '../tools/visualisation'

import { VisuState } from './typings'

export default async (bp: typeof sdk, state: VisuState) => {
  const longJobsPool = {}
  const router = bp.http.createRouterForBot('new_qna')
  const glob_res = []

  router.get('/confusionMatrix', async (req, res) => {
    const botId = req.params.botId
    const newAxiosConfig = await bp.http.getAxiosConfigForBot(botId, { localUrl: true })
    state[botId].predictor.axiosConfig = newAxiosConfig
    state[botId].axiosConfig = newAxiosConfig
    const jobId = nanoid()
    res.send(jobId)
    longJobsPool[jobId] = { status: 'computing', data: undefined, error: undefined, cm: true }
    try {
      longJobsPool[jobId].data = await computeConfusionMatrix(state[botId], glob_res)
      longJobsPool[jobId].status = 'done'
    } catch (e) {
      console.log('Erreur test paris: ', e)
      longJobsPool[jobId].status = 'crashed'
      longJobsPool[jobId].error = e.data
    }
  })
  router.get('/loadDatas', async (req, res) => {
    res.send(await getTrainTestDatas(state[req.params.botId]))
  })

  router.get('/similarityEmbeddings', async (req, res) => {
    res.send(await computeEmbeddingSimilarity(state[req.params.botId]))
  })

  router.get('/similarityIntents', async (req, res) => {
    res.send(await computeIntentSimilarity(state[req.params.botId]))
  })

  router.get('/scatterTsneEmbeddings', async (req, res) => {
    res.send(await computeTsneScatterEmbeddings(state[req.params.botId]))
  })

  router.get('/scatterEmbeddings', async (req, res) => {
    res.send(await computeScatterEmbeddings(state[req.params.botId]))
  })

  router.get('/computeOutliers', async (req, res) => {
    res.send(computeOutliers(state[req.params.botId]))
  })

  router.get('/long-jobs-status/:jobId', async (req, res) => {
    const newAxiosConfig = await bp.http.getAxiosConfigForBot(req.params.botId, { localUrl: true })
    state[req.params.botId].predictor.axiosConfig = newAxiosConfig
    state[req.params.botId].axiosConfig = newAxiosConfig
    if (longJobsPool[req.params.jobId].cm) {
      const CM2 = ConfusionMatrix.fromLabels(
        glob_res.map(o => o.gt),
        glob_res.map(o => o.pred)
      )
      // Normalize the confusion matrix
      const CM = new Matrix(CM2.matrix)
      CM2.matrix = CM.divColumnVector(CM2.matrix.map(row => _.sum(row) + 0.01)).to2DArray()

      const plotlyMatrixData = [
        {
          x: CM2.labels,
          y: CM2.labels,
          z: CM2.matrix,
          type: 'heatmap'
        }
      ]

      const layout = {
        title: 'ConfusionMatrix',
        annotations: [],
        xaxis: {
          ticks: '',
          side: 'top'
        },
        yaxis: {
          tickangle: -90,
          ticks: '',
          ticksuffix: ' ',
          width: 700,
          height: 700,
          autosize: false
        }
      }

      for (let i = 0; i < CM2.labels.length; i++) {
        for (let j = 0; j < CM2.labels.length; j++) {
          const result = {
            xref: 'x1',
            yref: 'y1',
            x: CM2.labels[j],
            y: CM2.labels[i],
            text: CM2.matrix[i][j],
            font: {
              family: 'Arial',
              size: 12,
              color: 'rgb(50, 171, 96)'
            },
            showarrow: false
          }
          layout.annotations.push(result)
        }
      }
      longJobsPool[req.params.jobId].data = { data: plotlyMatrixData, layout: layout }
    }
    res.send(longJobsPool[req.params.jobId])
  })
}

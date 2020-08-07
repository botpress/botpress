import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import nanoid from 'nanoid'

import { getTrainTestDatas } from '../tools/data_loader'
import {
  computeConfusionMatrix,
  computeEmbeddingSimilarity,
  computeKmeansPairwiseIntent,
  computeOutliers,
  computeScatterEmbeddings
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
      bp.logger.info('Done computing Confusion Matrix')
    } catch (e) {
      bp.logger.error('Error while trying to compute confusion matrix : ', e)
      longJobsPool[jobId].status = 'crashed'
      longJobsPool[jobId].error = e.data
    }
  })

  router.get('/loadDatas', async (req, res) => {
    const botId = req.params.botId
    const newAxiosConfig = await bp.http.getAxiosConfigForBot(botId, { localUrl: true })
    state[botId].predictor.axiosConfig = newAxiosConfig
    state[botId].axiosConfig = newAxiosConfig
    const jobId = nanoid()
    res.send(jobId)
    longJobsPool[jobId] = { status: 'computing', data: undefined, error: undefined, cm: false }
    try {
      await getTrainTestDatas(state[req.params.botId], bp.logger)
      longJobsPool[jobId].status = 'done'
      bp.logger.info('Done loading train and test datas')
    } catch (e) {
      bp.logger.error('Error while trying to load datas : ', e)
      longJobsPool[jobId].status = 'crashed'
      longJobsPool[jobId].error = e.data
    }
  })

  router.get('/similarityEmbeddings', async (req, res) => {
    res.send(await computeEmbeddingSimilarity(state[req.params.botId]))
  })

  router.get('/similarityIntents', async (req, res) => {
    res.send(await computeKmeansPairwiseIntent(state[req.params.botId]))
  })

  router.get('/scatterEmbeddings', async (req, res) => {
    res.send(await computeScatterEmbeddings(state[req.params.botId], bp.logger))
  })

  router.get('/computeOutliers', async (req, res) => {
    res.send(computeOutliers(state[req.params.botId]))
  })

  router.get('/long-jobs-status/:jobId', async (req, res) => {
    const newAxiosConfig = await bp.http.getAxiosConfigForBot(req.params.botId, { localUrl: true })
    state[req.params.botId].predictor.axiosConfig = newAxiosConfig
    state[req.params.botId].axiosConfig = newAxiosConfig

    if (longJobsPool[req.params.jobId].cm) {
      longJobsPool[req.params.jobId].data = glob_res
    }

    res.send(longJobsPool[req.params.jobId])
  })
}

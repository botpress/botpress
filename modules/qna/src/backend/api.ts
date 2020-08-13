import * as sdk from 'botpress/sdk'
import { Request, Response } from 'express'
import { validate } from 'joi'
import _ from 'lodash'
// import moment from 'moment'
// import multer from 'multer'
// import nanoid from 'nanoid'

import { QnaEntry, ScopedBots } from './qna'
// import { importQuestions, prepareExport, prepareImport } from './transfer'
// import { getIntentActions } from './utils'
import { QnaDefSchema } from './validation'

export default async (bp: typeof sdk, bots: ScopedBots) => {
  // const jsonUploadStatuses = {}
  const router = bp.http.createRouterForBot('qna')

  router.get('/:topicName/questions', async (req: Request, res: Response) => {
    try {
      // const {
      //   query: { question = '', filteredContexts = [], limit, offset, stateFilter, order, lang }
      // } = req

      const { storage } = bots[req.params.botId]
      const items = await storage.fetchItems(req.params.topicName)

      // const items = await storage.getQuestions(
      //   { question, filteredContexts, stateFilter, order, lang },
      //   { limit, offset }
      // )
      const data = { count: items.length, items }
      res.send(data)
    } catch (e) {
      bp.logger.attachError(e).error('Error listing questions')
      res.status(500).send(e.message || 'Error')
    }
  })

  router.post('/:topicName/questions', async (req: Request, res: Response, next: Function) => {
    try {
      const { storage } = bots[req.params.botId]
      const id = await storage.updateSingleItem(req.params.topicName, req.body)
      res.send(id)
    } catch (e) {
      next(new Error(e.message))
    }
  })

  router.get('/:topicName/questions/:id', async (req: Request, res: Response) => {
    try {
      const { storage } = bots[req.params.botId]
      const items = await storage.fetchItems(req.params.topicName)
      // const question = await storage.getQnaItem(req.params.id)
      const item = items.find(x => x.id === req.params.id)
      if (!item) {
        throw new Error(`QnA "${req.params.id}" Not found`)
      }
      res.send(item)
    } catch (e) {
      sendToastError('Fetch', e.message)
    }
  })

  router.post('/:topicName/questions/:id', async (req: Request, res: Response, next: Function) => {
    // const {
    //   query: { limit, offset, question, filteredContexts, stateFilter, order, lang }
    // } = req

    try {
      const { storage } = bots[req.params.botId]
      await storage.updateSingleItem(req.params.topicName, { ...req.body, id: req.params.id })

      // const questions = await storage.getQuestions(
      //   { question, filteredContexts, stateFilter, order, lang },
      //   { limit, offset }
      // )

      const items = await storage.fetchItems(req.params.topicName)
      res.send(items)
    } catch (e) {
      next(new Error(e.message))
    }
  })

  router.post('/:topicName/questions/:id/delete', async (req: Request, res: Response) => {
    // const {
    //   query: { limit, offset, question, filteredContexts, stateFilter, order, lang }
    // } = req

    try {
      const { storage } = bots[req.params.botId]
      await storage.deleteSingleItem(req.params.topicName, req.params.id)

      // const questions = await storage.getQuestions(
      //   { question, filteredContexts, stateFilter, order, lang },
      //   { limit, offset }
      // )

      const items = await storage.fetchItems(req.params.topicName)
      res.send(items)
    } catch (e) {
      bp.logger.attachError(e).error(`Could not delete QnA #${req.params.id}`)
      res.status(500).send(e.message || 'Error')
      sendToastError('Delete', e.message)
    }
  })

  // router.get('/export', async (req: Request, res: Response) => {
  //   const { storage } = bots[req.params.botId]
  //   const data: string = await prepareExport(storage, bp)

  //   res.setHeader('Content-Type', 'application/json')
  //   res.setHeader('Content-disposition', `attachment; filename=qna_${moment().format('DD-MM-YYYY')}.json`)
  //   res.end(data)
  // })

  // router.get('/contentElementUsage', async (req: Request, res: Response) => {
  //   const { storage } = bots[req.params.botId]
  //   const usage = await storage.getContentElementUsage()
  //   res.send(usage)
  // })

  // const upload = multer()
  // TODO: re-implement import / export
  // router.post('/analyzeImport', upload.single('file'), async (req: any, res: Response) => {
  //   const { storage } = bots[req.params.botId]
  //   const cmsIds = await storage.getAllContentElementIds()
  //   const importData = await prepareImport(JSON.parse(req.file.buffer))

  //   res.send({
  //     qnaCount: await storage.count(),
  //     cmsCount: (cmsIds && cmsIds.length) || 0,
  //     fileQnaCount: (importData.questions && importData.questions.length) || 0,
  //     fileCmsCount: (importData.content && importData.content.length) || 0
  //   })
  // })

  // router.post('/import', upload.single('file'), async (req: any, res: Response) => {
  //   const uploadStatusId = nanoid()
  //   res.send(uploadStatusId)

  //   const { storage } = bots[req.params.botId]

  //   if (req.body.action === 'clear_insert') {
  //     updateUploadStatus(uploadStatusId, 'Deleting existing questions')
  //     const questions = await storage.fetchQNAs()

  //     await storage.delete(questions.map(({ id }) => id))
  //     updateUploadStatus(uploadStatusId, 'Deleted existing questions')
  //   }

  //   try {
  //     const importData = await prepareImport(JSON.parse(req.file.buffer))

  //     await importQuestions(importData, storage, bp, updateUploadStatus, uploadStatusId)
  //     updateUploadStatus(uploadStatusId, 'Completed')
  //   } catch (e) {
  //     bp.logger.attachError(e).error('JSON Import Failure')
  //     updateUploadStatus(uploadStatusId, `Error: ${e.message}`)
  //   }
  // })

  // router.get('/json-upload-status/:uploadStatusId', async (req: Request, res: Response) => {
  //   res.end(jsonUploadStatuses[req.params.uploadStatusId])
  // })

  // router.post('/intentActions', async (req: Request, res: Response) => {
  //   const { intentName, event } = req.body

  //   try {
  //     res.send(await getIntentActions(intentName, event, { bp, ...bots[req.params.botId] }))
  //   } catch (err) {
  //     bp.logger.attachError(err).error(err.message)
  //     res.status(200).send([])
  //   }
  // })

  // TODO: delete front-end code that calls this
  // router.get('/questionsByTopic', async (req: Request, res: Response) => {
  //   try {
  //     const { storage } = bots[req.params.botId]
  //     res.send(await storage.getCountByTopic())
  //   } catch (e) {
  //     res.status(500).send(e.message || 'Error')
  //   }
  // })

  const sendToastError = (action: string, error: string) => {
    bp.realtime.sendPayload(
      bp.RealTimePayload.forAdmins('toast.qna-save', { text: `QnA ${action} Error: ${error}`, type: 'error' })
    )
  }

  // const updateUploadStatus = (uploadStatusId: string, status: string) => {
  //   if (uploadStatusId) {
  //     jsonUploadStatuses[uploadStatusId] = status
  //   }
  // }
}

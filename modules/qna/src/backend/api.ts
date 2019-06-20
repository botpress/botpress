import * as sdk from 'botpress/sdk'
import { validate } from 'joi'
import _ from 'lodash'
import moment from 'moment'
import multer from 'multer'
import nanoid from 'nanoid'
import yn from 'yn'

import { QnaEntry, QnaItem } from './qna'
import Storage from './storage'
import { importQuestions, prepareExport } from './transfer'
import { QnaDefSchema, QnaItemArraySchema } from './validation'

export default async (bp: typeof sdk, botScopedStorage: Map<string, Storage>) => {
  const jsonUploadStatuses = {}
  const router = bp.http.createRouterForBot('qna')

  router.get('/questions', async (req, res) => {
    try {
      const {
        query: { question = '', categories = [], limit, offset }
      } = req

      const storage = botScopedStorage.get(req.params.botId)
      const items = await storage.getQuestions({ question, categories }, { limit, offset })
      res.send({ ...items })
    } catch (e) {
      bp.logger.attachError(e).error('Error listing questions')
      res.status(500).send(e.message || 'Error')
    }
  })

  router.post('/questions', async (req, res, next) => {
    try {
      const qnaEntry = (await validate(req.body, QnaDefSchema)) as QnaEntry
      const storage = botScopedStorage.get(req.params.botId)
      const id = await storage.insert(qnaEntry)
      res.send(id)
    } catch (e) {
      next(new Error(e.message))
    }
  })

  router.get('/questions/:id', async (req, res) => {
    try {
      const storage = botScopedStorage.get(req.params.botId)
      const question = await storage.getQnaItem(req.params.id)
      res.send(question)
    } catch (e) {
      sendToastError('Fetch', e.message)
    }
  })

  router.put('/questions/:id', async (req, res, next) => {
    const {
      query: { limit, offset, question, categories }
    } = req

    try {
      const qnaEntry = (await validate(req.body, QnaDefSchema)) as QnaEntry
      const storage = botScopedStorage.get(req.params.botId)
      await storage.update(qnaEntry, req.params.id)

      const questions = await storage.getQuestions({ question, categories }, { limit, offset })
      res.send(questions)
    } catch (e) {
      next(new Error(e.message))
    }
  })

  router.delete('/questions/:id', async (req, res) => {
    const {
      query: { limit, offset, question, categories }
    } = req

    try {
      const storage = botScopedStorage.get(req.params.botId)
      await storage.delete(req.params.id)
      const questionsData = await storage.getQuestions({ question, categories }, { limit, offset })
      res.send(questionsData)
    } catch (e) {
      bp.logger.attachError(e).error('Could not delete QnA #' + req.params.id)
      res.status(500).send(e.message || 'Error')
      sendToastError('Delete', e.message)
    }
  })

  router.get('/categories', async (req, res) => {
    const storage = botScopedStorage.get(req.params.botId)
    const categories = await storage.getCategories()
    res.send({ categories })
  })

  router.get('/export', async (req, res) => {
    const storage = botScopedStorage.get(req.params.botId)
    const data: string = await prepareExport(storage)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-disposition', `attachment; filename=qna_${moment().format('DD-MM-YYYY')}.json`)
    res.end(data)
  })

  const upload = multer()
  router.post('/import', upload.single('json'), async (req, res) => {
    const storage = botScopedStorage.get(req.params.botId)

    const uploadStatusId = nanoid()
    res.end(uploadStatusId)

    if (yn(req.body.isReplace)) {
      updateUploadStatus(uploadStatusId, 'Deleting existing questions')
      const questions = await storage.fetchQNAs()

      await storage.delete(questions.map(({ id }) => id))
      updateUploadStatus(uploadStatusId, 'Deleted existing questions')
    }

    try {
      const parsedJson: any = JSON.parse(req.file.buffer)
      const questions = (await validate(parsedJson, QnaItemArraySchema)) as QnaItem[]

      await importQuestions(questions, storage, updateUploadStatus, uploadStatusId)
      updateUploadStatus(uploadStatusId, 'Completed')
    } catch (e) {
      bp.logger.attachError(e).error('JSON Import Failure')
      updateUploadStatus(uploadStatusId, `Error: ${e.message}`)
    }
  })

  router.get('/json-upload-status/:uploadStatusId', async (req, res) => {
    res.end(jsonUploadStatuses[req.params.uploadStatusId])
  })

  const sendToastError = (action, error) => {
    bp.realtime.sendPayload(
      bp.RealTimePayload.forAdmins('toast.qna-save', { text: `QnA ${action} Error: ${error}`, type: 'error' })
    )
  }

  const updateUploadStatus = (uploadStatusId, status) => {
    if (!uploadStatusId) {
      return
    }
    jsonUploadStatuses[uploadStatusId] = status
  }
}

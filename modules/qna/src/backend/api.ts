import * as sdk from 'botpress/sdk'
import iconv from 'iconv-lite'
import { validate } from 'joi'
import { Parser as Json2csvParser } from 'json2csv'
import _ from 'lodash'
import moment from 'moment'
import multer from 'multer'
import nanoid from 'nanoid'
import yn from 'yn'

import { QnaEntry, QnaStorage } from './qna'
import { importQuestions, prepareExport } from './transfer'
import { QnaDefSchema } from './validation'

export default async (bp: typeof sdk, botScopedStorage: Map<string, QnaStorage>) => {
  const csvUploadStatuses = {}
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
      const question = await storage.getQuestion(req.params.id)
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
      await storage.delete(req.params.id, undefined)
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

  router.get('/export/:format', async (req, res) => {
    const storage = botScopedStorage.get(req.params.botId)
    const config = await bp.config.getModuleConfigForBot('qna', req.params.botId)
    const data = await prepareExport(storage, { flat: true })

    if (req.params.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-disposition', `attachment; filename=qna_${moment().format('DD-MM-YYYY')}.csv`)

      const categoryWrapper = storage.hasCategories() ? ['category'] : []
      const parseOptions = {
        fields: ['question', 'action', 'answer', 'answer2', ...categoryWrapper],
        header: true
      }
      const json2csvParser = new Json2csvParser(parseOptions)

      res.end(iconv.encode(json2csvParser.parse(data), config.exportCsvEncoding))
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-disposition', `attachment; filename=qna_${moment().format('DD-MM-YYYY')}.json`)
      res.end(JSON.stringify(data))
    }
  })

  const upload = multer()
  router.post('/import/csv', upload.single('csv'), async (req, res) => {
    const storage = botScopedStorage.get(req.params.botId)
    const config = await bp.config.getModuleConfigForBot('qna', req.params.botId)

    const uploadStatusId = nanoid()
    res.end(uploadStatusId)

    updateUploadStatus(uploadStatusId, 'Deleting existing questions')
    if (yn(req.body.isReplace)) {
      const questions = await storage.fetchAllQuestions()

      const statusCb = processedCount =>
        updateUploadStatus(uploadStatusId, `Deleted ${processedCount}/${questions.length} questions`)
      await storage.delete(questions.map(({ id }) => id), statusCb)
    }

    try {
      const questions = iconv.decode(req.file.buffer, config.exportCsvEncoding)
      const params = {
        storage,
        config,
        format: 'csv',
        statusCallback: updateUploadStatus,
        uploadStatusId
      }
      await importQuestions(questions, params)

      updateUploadStatus(uploadStatusId, 'Completed')
    } catch (e) {
      bp.logger.attachError(e).error('CSV Import Failure')
      updateUploadStatus(uploadStatusId, `Error: ${e.message}`)
    }
  })

  router.get('/csv-upload-status/:uploadStatusId', async (req, res) => {
    res.end(csvUploadStatuses[req.params.uploadStatusId])
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
    csvUploadStatuses[uploadStatusId] = status
  }
}

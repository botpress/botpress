import iconv from 'iconv-lite'
import { Parser as Json2csvParser } from 'json2csv'
import _ from 'lodash'
import moment from 'moment'
import multer from 'multer'
import nanoid from 'nanoid'
import yn from 'yn'

import { QnaStorage, SDK } from './qna'
import { importQuestions, prepareExport } from './transfer'

export default async (bp: SDK, botScopedStorage: Map<string, QnaStorage>) => {
  const csvUploadStatuses = {}
  const router = bp.http.createRouterForBot('qna')

  router.get('/list', async (req, res) => {
    try {
      const {
        query: { question = '', categories = [], limit, offset }
      } = req

      const storage = botScopedStorage.get(req.params.botId)
      const items = await storage.getQuestions({ question, categories }, { limit, offset })
      res.send({ ...items })
    } catch (e) {
      bp.logger.error('Error while listing: ', e)
      res.status(500).send(e.message || 'Error')
    }
  })

  router.post('/create', async (req, res) => {
    try {
      const storage = botScopedStorage.get(req.params.botId)
      const id = await storage.insert(req.body)
      res.send(id)
    } catch (e) {
      bp.logger.error('Error while creating: ', e)
      res.status(500).send(e.message || 'Error')
      sendToastError('Save', e.message)
    }
  })

  router.get('/question/:id', async (req, res) => {
    try {
      const storage = botScopedStorage.get(req.params.botId)
      const question = await storage.getQuestion(req.params.id)
      res.send(question)
    } catch (e) {
      sendToastError('Fetch', e.message)
    }
  })

  router.put('/:question', async (req, res) => {
    const {
      query: { limit, offset, question, categories }
    } = req

    try {
      const storage = botScopedStorage.get(req.params.botId)
      await storage.update(req.body, req.params.question)
      const questions = await storage.getQuestions({ question, categories }, { limit, offset })
      res.send(questions)
    } catch (e) {
      bp.logger.error('Update error: ', e)
      res.status(500).send(e.message || 'Error')
      sendToastError('Update', e.message)
    }
  })

  router.delete('/:question', async (req, res) => {
    const {
      query: { limit, offset, question, categories }
    } = req

    try {
      const storage = botScopedStorage.get(req.params.botId)
      await storage.delete(req.params.question, undefined)
      const questionsData = await storage.getQuestions({ question, categories }, { limit, offset })
      res.send(questionsData)
    } catch (e) {
      bp.logger.error('Delete error: ', e)
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
      bp.logger.error('Upload error :', e)
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

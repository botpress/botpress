import Bluebird from 'bluebird'
import * as sdk from 'botpress/sdk'
import { eventNames } from 'cluster'
import iconv from 'iconv-lite'
import { Parser as Json2csvParser } from 'json2csv'
import _ from 'lodash'
import moment from 'moment'
import multer from 'multer'
import nanoid from 'nanoid'
import yn from 'yn'

import * as parsers from './parsers.js'
import { QnaStorage, SDK } from './types'

export default async (bp: SDK, config, storage: QnaStorage) => {
  const csvUploadStatuses = {}

  const recordCsvUploadStatus = (csvUploadStatusId, status) => {
    if (!csvUploadStatusId) {
      return
    }
    csvUploadStatuses[csvUploadStatusId] = status
  }

  bp.qna = {
    async import(questions, { format = 'json', csvUploadStatusId = '' } = {}) {
      recordCsvUploadStatus(csvUploadStatusId, 'Calculating diff with existing questions')
      const existingQuestions = (await storage.all()).map(item => JSON.stringify(_.omit(item.data, 'enabled')))
      const parsedQuestions = typeof questions === 'string' ? parsers[`${format}Parse`](questions) : questions
      const questionsToSave = parsedQuestions.filter(item => !existingQuestions.includes(JSON.stringify(item)))

      if (config.qnaMakerApiKey) {
        return storage.insert(questionsToSave.map(question => ({ ...question, enabled: true })))
      }

      let questionsSavedCount = 0
      return Promise.each(questionsToSave, question =>
        storage.insert({ ...question, enabled: true }).then(() => {
          questionsSavedCount += 1
          recordCsvUploadStatus(csvUploadStatusId, `Saved ${questionsSavedCount}/${questionsToSave.length} questions`)
        })
      )
    },

    async export({ flat = false } = {}) {
      const qnas = await storage.all()

      return qnas.flatMap(question => {
        const { data } = question
        const { questions, answer: textAnswer, action, redirectNode, redirectFlow } = data

        let answer = textAnswer
        let answer2 = undefined

        if (action === 'redirect') {
          answer = redirectFlow
          if (redirectNode) {
            answer += '#' + redirectNode
          }
        } else if (action === 'text_redirect') {
          answer2 = redirectFlow
          if (redirectNode) {
            answer2 += '#' + redirectNode
          }
        }

        if (!flat) {
          return { questions, action, answer, answer2 }
        }
        return questions.map(question => ({ question, action, answer, answer2 }))
      })
    },

    getQuestion: storage.getQuestion.bind(storage),
    answersOn: storage.answersOn.bind(storage)
  }

  const router = bp.http.createRouterForBot('qna')

  const sendToastProgress = action => {
    bp.realtime.sendPayload(
      bp.RealTimePayload.forAdmins('toast.qna-save', { text: `QnA ${action} In Progress`, type: 'info', time: 120000 })
    )
  }

  const sendToastSuccess = action => {
    bp.realtime.sendPayload(
      bp.RealTimePayload.forAdmins('toast.qna-save', { text: `QnA ${action} Success`, type: 'success' })
    )
  }

  const sendToastError = (action, error) => {
    bp.realtime.sendPayload(
      bp.RealTimePayload.forAdmins('toast.qna-save', { text: `QnA ${action} Error: ${error}`, type: 'error' })
    )
  }

  router.get('/list', async ({ query: { limit, offset } }, res) => {
    try {
      const items = await storage.all({
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      })
      const overallItemsCount = await storage.count()
      res.send({ items, overallItemsCount })
    } catch (e) {
      bp.logger.error('QnA Error', e)
      res.status(500).send(e.message || 'Error')
    }
  })

  router.post('/create', async (req, res) => {
    try {
      sendToastProgress('Save')
      const id = await storage.insert(req.body)
      res.send(id)
      sendToastSuccess('Save')
    } catch (e) {
      bp.logger.error('QnA Error', e)
      res.status(500).send(e.message || 'Error')
      sendToastError('Save', e.message)
    }
  })

  router.put('/:question', async (req, res) => {
    try {
      sendToastProgress('Update')
      await storage.update(req.body, req.params.question)
      sendToastSuccess('Update')
      res.end()
    } catch (e) {
      bp.logger.error('QnA Error', eventNames)
      res.status(500).send(e.message || 'Error')
      sendToastError('Update', e.message)
    }
  })

  router.delete('/:question', async (req, res) => {
    try {
      sendToastProgress('Delete')
      await storage.delete(req.params.question)
      sendToastSuccess('Delete')
      res.end()
    } catch (e) {
      bp.logger.error('QnA Error', e)
      res.status(500).send(e.message || 'Error')

      sendToastError('Delete', e.message)
    }
  })

  router.get('/csv', async (req, res) => {
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-disposition', `attachment; filename=qna_${moment().format('DD-MM-YYYY')}.csv`)
    const json2csvParser = new Json2csvParser({ fields: ['question', 'action', 'answer', 'answer2'], header: true })
    res.end(iconv.encode(json2csvParser.parse(await bp.qna.export({ flat: true })), config.exportCsvEncoding))
  })

  const upload = multer()
  router.post('/csv', upload.single('csv'), async (req, res) => {
    const csvUploadStatusId = nanoid()
    res.end(csvUploadStatusId)
    recordCsvUploadStatus(csvUploadStatusId, 'Deleting existing questions')
    if (yn(req.body.isReplace)) {
      const questions = await this.storage.all()
      await storage.delete(questions.map(({ id }) => id))
    }

    try {
      const questions = iconv.decode(req.file.buffer, config.exportCsvEncoding)

      await bp.qna.import(questions, { format: 'csv', csvUploadStatusId })
      recordCsvUploadStatus(csvUploadStatusId, 'Completed')
    } catch (e) {
      bp.logger.error('QnA Error:', e)
      recordCsvUploadStatus(csvUploadStatusId, `Error: ${e.message}`)
    }
  })

  router.get('/csv-upload-status/:csvUploadStatusId', async (req, res) => {
    res.end(csvUploadStatuses[req.params.csvUploadStatusId])
  })
}

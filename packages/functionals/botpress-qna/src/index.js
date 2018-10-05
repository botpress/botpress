import NluStorage from './providers/nlu'
import MicrosoftQnaMakerStorage, { qnaItemData } from './providers/qnaMaker'
import { processEvent } from './middleware'
import * as parsers from './parsers.js'
import _ from 'lodash'
import multer from 'multer'
import { Parser as Json2csvParser } from 'json2csv'
import yn from 'yn'
import moment from 'moment'
import iconv from 'iconv-lite'
import nanoid from 'nanoid'

let logger
let shouldProcessMessage
const csvUploadStatuses = {}

const recordCsvUploadStatus = (csvUploadStatusId, status) => {
  if (!csvUploadStatusId) {
    return
  }
  csvUploadStatuses[csvUploadStatusId] = status
}

module.exports = {
  config: {
    qnaDir: { type: 'string', required: true, default: './qna', env: 'QNA_DIR' },
    textRenderer: { type: 'string', required: true, default: '#builtin_text', env: 'QNA_TEXT_RENDERER' },
    exportCsvEncoding: { type: 'string', required: false, default: 'utf8', env: 'QNA_EXPORT_CSV_ENCODING' },
    qnaMakerApiKey: { type: 'string', required: false, env: 'QNA_MAKER_API_KEY' },
    qnaMakerKnowledgebase: { type: 'string', required: false, default: 'botpress', env: 'QNA_MAKER_KNOWLEDGEBASE' }
  },
  async init(bp, configurator) {
    const config = await configurator.loadAll()
    this.isMicrosoftMakerUsed = config.qnaMakerApiKey
    const Storage = this.isMicrosoftMakerUsed ? MicrosoftQnaMakerStorage : NluStorage
    this.storage = new Storage({ bp, config })
    await this.storage.initialize()

    logger = bp.logger

    bp.middlewares.register({
      name: 'qna.incoming',
      module: 'botpress-qna',
      type: 'incoming',
      handler: async (event, next) => {
        if (typeof shouldProcessMessage === 'function') {
          const state = await bp.dialogEngine.stateManager.getState(event.sessionId || event.user.id)
          const shouldSkip = (await shouldProcessMessage(event, state)) === false
          if (shouldSkip) {
            return next()
          }
        }
        if (!await processEvent(event, { bp, storage: this.storage, logger, config })) {
          next()
        }
      },
      order: 11, // must be after the NLU middleware and before the dialog middleware
      description: 'Listen for predefined questions and send canned responses.'
    })
  },
  async ready(bp, configurator) {
    const config = await configurator.loadAll()
    const storage = this.storage
    let categories = []
    bp.qna = {
      /**
       * Parses and imports questions; consecutive questions with similar answer get merged
       * @param {String|Array.<{question: String, action: String, answer: String}>} questions
       * @param {Object} options
       * @param {String} [options.format] - format of "questions" string ('csv' or 'json')
       * @returns {Promise} Promise object represents an array of ids of imported questions
       */
      async import(questions, { format = 'json', csvUploadStatusId } = {}) {
        recordCsvUploadStatus(csvUploadStatusId, 'Calculating diff with existing questions')
        const existingQuestions = (await storage.all()).map(item => JSON.stringify(_.omit(item.data, 'enabled')))
        const parsedQuestions =
          typeof questions === 'string'
            ? parsers[`${format}Parse`](questions, { hasCategory: config.qnaMakerApiKey })
            : questions
        const questionsToSave = parsedQuestions.filter(item => !existingQuestions.includes(JSON.stringify(item)))

        if (config.qnaMakerApiKey) {
          recordCsvUploadStatus(csvUploadStatusId, `Inserting ${questionsToSave.length} questions in bulk`)
        }

        const statusCb = processedCount =>
          recordCsvUploadStatus(csvUploadStatusId, `Saved ${processedCount}/${questionsToSave.length} questions`)
        return storage.insert(questionsToSave.map(question => ({ ...question, enabled: true })), statusCb)
      },

      /**
       * @async
       * Fetches questions and represents them as json
       * @param {Object} options
       * @param {Boolean} [options.flat = false] - whether multiple questions get split into separate records
       * @returns {Array.<{questions: Array, question: String, action: String, answer: String}>}
       */
      async export({ flat = false } = {}) {
        const qnas = await storage.all()

        return qnas.flatMap(question => {
          const { data } = question
          const { questions, answer: textAnswer, action, redirectNode, redirectFlow, category } = data

          let answer = textAnswer
          let answer2 = null

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

          const categoryWrapper = config.qnaMakerApiKey ? { category } : {}

          if (!flat) {
            return { questions, action, answer, answer2, ...categoryWrapper }
          }
          return questions.map(question => ({ question, action, answer, answer2, ...categoryWrapper }))
        })
      },

      /**
       * Accepts async function that is later used to check if Q&A module should intercept
       * @param {function} fn
       */
      shouldProcessMessage(fn) {
        shouldProcessMessage = fn
      },

      /**
       * @async
       * Returns question by id
       * @param {String} id - id of the question to look for
       * @returns {Object}
       */
      getQuestion: storage.getQuestion.bind(storage),

      /**
       * @async
       * Returns array of matchings questions-answers along with their confidence level
       * @param {String} question - question to match against
       * @returns {Array.<{questions: Array, answer: String, id: String, confidence: Number, metadata: Array}>}
       */
      answersOn: storage.answersOn.bind(storage),

      /**
       * @param {string[]} categoriesToRegister - array of category names to register
       */

      registerCategories(categoriesToRegister) {
        if (!_.isArray(categoriesToRegister)) {
          return
        }
        categories = [...categories, ...categoriesToRegister]
      }
    }

    const router = bp.getRouter('botpress-qna')

    const getFieldFromMetadata = (metadata, field) => metadata.find(({ name }) => name === field)

    const filterByCategoryAndQuestion = async ({ question, categories }) => {
      const allQuestions = await this.storage.fetchQuestions()
      const filteredQuestions = allQuestions.filter(({ questions, metadata }) => {
        const category = getFieldFromMetadata(metadata, 'category')

        const isRightId =
          questions
            .join('\n')
            .toLowerCase()
            .indexOf(question.toLowerCase()) !== -1

        if (!categories.length) {
          return isRightId
        }

        if (!question) {
          return category && categories.indexOf(category.value) !== -1
        }

        return isRightId && category && categories.indexOf(category.value) !== -1
      })

      const questions = filteredQuestions.reverse().map(qna => ({ id: qna.id, data: qnaItemData(qna) }))

      return questions
    }

    const getQuestions = async ({ question = '', categories = [] }, { limit = 50, offset = 0 }) => {
      let items = []
      let count = 0

      if (!(question || categories.length)) {
        items = await this.storage.all({
          limit: limit ? parseInt(limit) : undefined,
          offset: offset ? parseInt(offset) : undefined
        })
        count = await this.storage.count()
      } else {
        const tmpQuestions = await filterByCategoryAndQuestion({ question, categories })
        items = tmpQuestions.slice(offset, offset + limit)
        count = tmpQuestions.length
      }

      return { items, count }
    }

    router.get('/', async ({ query: { question = '', categories = [], limit, offset } }, res) => {
      try {
        const items = await getQuestions({ question, categories }, { limit, offset })
        res.send({ ...items })
      } catch (e) {
        logger.error('QnA Error', e, e.stack)
        res.status(500).send(e.message || 'Error')
      }
    })

    router.post('/', async (req, res) => {
      try {
        bp.events.emit('toast.qna-save', { text: 'QnA Save In Progress', type: 'info', time: 120000 })
        const id = await this.storage.insert(req.body)

        res.send(id)

        bp.events.emit('toast.qna-save', { text: 'QnA Save Success', type: 'success' })
      } catch (e) {
        logger.error('QnA Error', e, e.stack)
        res.status(500).send(e.message || 'Error')

        bp.events.emit('toast.qna-save', { text: `QnA Save Error: ${e.message}`, type: 'error' })
      }
    })

    router.get('/question/:id', async (req, res) => {
      try {
        const question = await this.storage.getQuestion(req.params.id)

        res.send(question)
      } catch (err) {
        bp.events.emit('toast.qna-save', { text: `QnA Fetch Error: ${err.message}`, type: 'error' })
      }
    })

    router.put('/:question', async (req, res) => {
      const { query: { limit, offset, question, categories } } = req

      try {
        bp.events.emit('toast.qna-save', { text: 'QnA Update In Progress', type: 'info', time: 120000 })
        await this.storage.update(req.body, req.params.question)
        const questions = await getQuestions({ question, categories }, { limit, offset })

        bp.events.emit('toast.qna-save', { text: 'QnA Update Success', type: 'success' })

        res.send(questions)
      } catch (e) {
        logger.error('QnA Error', e, e.stack)
        res.status(500).send(e.message || 'Error')
        bp.events.emit('toast.qna-save', { text: `QnA Update Error: ${e.message}`, type: 'error' })
      }
    })

    router.delete('/:question', async (req, res) => {
      const { query: { limit, offset, question, categories } } = req
      try {
        bp.events.emit('toast.qna-save', { text: 'QnA Delete In Progress', type: 'info', time: 120000 })
        await this.storage.delete(req.params.question)

        const questionsData = await getQuestions({ question, categories }, { limit, offset })

        bp.events.emit('toast.qna-save', { text: 'QnA Delete Success', type: 'success' })

        res.send(questionsData)
      } catch (e) {
        logger.error('QnA Error', e, e.stack)
        res.status(500).send(e.message || 'Error')

        bp.events.emit('toast.qna-save', { text: `QnA Delete Error: ${e.message}`, type: 'error' })
      }
    })

    router.get('/csv', async (req, res) => {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-disposition', `attachment; filename=qna_${moment().format('DD-MM-YYYY')}.csv`)
      const categoryWrapper = this.isMicrosoftMakerUsed ? ['category'] : []
      const parseOptions = {
        fields: ['question', 'action', 'answer', 'answer2', ...categoryWrapper],
        header: true
      }

      const json2csvParser = new Json2csvParser(parseOptions)

      res.end(iconv.encode(json2csvParser.parse(await bp.qna.export({ flat: true })), config.exportCsvEncoding))
    })

    const upload = multer()
    router.post('/csv', upload.single('csv'), async (req, res) => {
      const csvUploadStatusId = nanoid()
      res.end(csvUploadStatusId)
      recordCsvUploadStatus(csvUploadStatusId, 'Deleting existing questions')
      if (yn(req.body.isReplace)) {
        const questions = await this.storage.all()

        const statusCb = processedCount =>
          recordCsvUploadStatus(csvUploadStatusId, `Deleted ${processedCount}/${questions.length} questions`)
        await this.storage.delete(questions.map(({ id }) => id), statusCb)
      }

      try {
        const questions = iconv.decode(req.file.buffer, config.exportCsvEncoding)

        await bp.qna.import(questions, { format: 'csv', csvUploadStatusId })
        recordCsvUploadStatus(csvUploadStatusId, 'Completed')
      } catch (e) {
        logger.error('QnA Error:', e)
        recordCsvUploadStatus(csvUploadStatusId, `Error: ${e.message}`)
      }
    })

    router.get('/csv-upload-status/:csvUploadStatusId', async (req, res) => {
      res.end(csvUploadStatuses[req.params.csvUploadStatusId])
    })

    router.get('/categories', (req, res) => {
      res.send({ categories })
    })
  }
}

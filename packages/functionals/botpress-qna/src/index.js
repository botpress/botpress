import Storage from './storage'
import { processEvent } from './middleware'
import * as parsers from './parsers.js'
import multer from 'multer'
import { Parser as Json2csvParser } from 'json2csv'
import yn from 'yn'
import moment from 'moment'
import Promise from 'bluebird'

let storage
let logger

module.exports = {
  config: {
    qnaDir: { type: 'string', required: true, default: './qna', env: 'QNA_DIR' },
    textRenderer: { type: 'string', required: true, default: '#builtin_text', env: 'QNA_TEXT_RENDERER' }
  },
  async init(bp, configurator) {
    const config = await configurator.loadAll()
    storage = new Storage({ bp, config })
    await storage.initializeGhost()

    logger = bp.logger

    bp.middlewares.register({
      name: 'qna.incoming',
      module: 'botpress-qna',
      type: 'incoming',
      handler: async (event, next) => {
        if (!await processEvent(event, { bp, storage, logger, config })) {
          next()
        }
      },
      order: 11, // must be after the NLU middleware and before the dialog middleware
      description: 'Listen for predefined questions and send canned responses.'
    })
  },
  ready(bp) {
    bp.qna = {
      /**
       * Parses and imports questions; consecutive questions with similar answer get merged
       * @param {String|Array.<{question: String, action: String, answer: String}>} questions
       * @param {Object} options
       * @param {String} [options.format] - format of "questions" string ('csv' or 'json')
       * @returns {Promise} Promise object represents an array of ids of imported questions
       */
      import(questions, { format = 'json' } = {}) {
        const questionsToSave = typeof questions === 'string' ? parsers[`${format}Parse`](questions) : questions
        return Promise.each(questionsToSave, question => storage.saveQuestion({ ...question, enabled: true }))
      },

      /**
       * @async
       * Fetches questions and represents them as json
       * @param {Object} options
       * @param {Boolean} [options.flat = false] - whether multiple questions get split into separate records
       * @returns {Array.<{questions: Array, question: String, action: String, answer: String}>}
       */
      async export({ flat = false } = {}) {
        const qnas = await storage.getQuestions()

        return qnas.flatMap(question => {
          const { data } = question
          const { questions, answer: textAnswer, action, redirectNode, redirectFlow } = data

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

          if (!flat) {
            return { questions, action, answer, answer2 }
          }
          return questions.map(question => ({ question, action, answer, answer2 }))
        })
      }
    }

    const router = bp.getRouter('botpress-qna')

    router.get('/', async (req, res) => {
      try {
        res.send(await storage.getQuestions())
      } catch (e) {
        logger.error('QnA Error', e, e.stack)
        res.status(500).send(e.message || 'Error')
      }
    })

    router.post('/', async (req, res) => {
      try {
        const id = await storage.saveQuestion(req.body)
        res.send(id)
      } catch (e) {
        logger.error('QnA Error', e, e.stack)
        res.status(500).send(e.message || 'Error')
      }
    })

    router.put('/:question', async (req, res) => {
      try {
        await storage.saveQuestion(req.body, req.params.question)
        res.end()
      } catch (e) {
        logger.error('QnA Error', e, e.stack)
        res.status(500).send(e.message || 'Error')
      }
    })

    router.delete('/:question', async (req, res) => {
      try {
        await storage.deleteQuestion(req.params.question)
        res.end()
      } catch (e) {
        logger.error('QnA Error', e, e.stack)
        res.status(500).send(e.message || 'Error')
      }
    })

    router.get('/csv', async (req, res) => {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-disposition', `attachment; filename=qna_${moment().format('DD-MM-YYYY')}.csv`)
      const json2csvParser = new Json2csvParser({ fields: ['question', 'action', 'answer', 'answer2'], header: true })
      res.end(json2csvParser.parse(await bp.qna.export({ flat: true })))
    })

    const upload = multer()
    router.post('/csv', upload.single('csv'), async (req, res) => {
      if (yn(req.body.isReplace)) {
        const questions = await storage.getQuestions()
        await Promise.each(questions, ({ id }) => storage.deleteQuestion(id))
      }

      try {
        await bp.qna.import(req.file.buffer.toString(), { format: 'csv' })
        res.end()
      } catch (e) {
        logger.error('QnA Error:', e)
        res.status(400).send(e.message || 'Error')
      }
    })
  }
}

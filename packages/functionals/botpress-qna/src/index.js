import Storage from './storage'
import { processEvent } from './middleware'

let storage
let logger

module.exports = {
  config: {
    qnaDir: { type: 'string', required: true, default: './qna', env: 'QNA_DIR' }
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
        if (!await processEvent(event, { bp, storage, logger })) {
          next()
        }
      },
      order: 11, // must be after the NLU middleware and before the dialog middleware
      description: 'Listen for predefined questions and send canned responses.'
    })
  },
  ready(bp) {
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
        const id = await storage.saveQuestion(null, req.body)
        res.send(id)
      } catch (e) {
        logger.error('QnA Error', e, e.stack)
        res.status(500).send(e.message || 'Error')
      }
    })

    router.put('/:question', async (req, res) => {
      try {
        await storage.saveQuestion(req.params.question, req.body)
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
  }
}

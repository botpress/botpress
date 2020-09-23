import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Application } from 'express'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { validate } from 'joi'
import _ from 'lodash'
import ms from 'ms'
import Engine from 'nlu-core/engine'

import { authMiddleware, handleErrorLogging, handleUnexpectedError } from '../http-utils'
import Logger from '../simple-logger'

import makeLoggerWrapper from './logger-wrapper'
import ModelService from './model-service'
import TrainService from './train-service'
import TrainSessionService from './train-session-service'
import { TrainInput } from './typings'
import { TrainInputCreateSchema } from './validation'

export interface APIOptions {
  host: string
  port: number
  modelDir: string
  authToken?: string
  limitWindow: string
  limit: number
}

const debug = DEBUG('api')
const debugRequest = debug.sub('request')

const createExpressApp = (options: APIOptions): Application => {
  const app = express()

  // This must be first, otherwise the /info endpoint can't be called when token is used
  app.use(cors())

  app.use(bodyParser.json({ limit: '250kb' }))

  app.use((req, res, next) => {
    res.header('X-Powered-By', 'Botpress')
    debugRequest('incoming ' + req.path, { ip: req.ip })
    next()
  })

  app.use(handleUnexpectedError)

  if (process.core_env.REVERSE_PROXY) {
    app.set('trust proxy', process.core_env.REVERSE_PROXY)
  }

  if (options.limit > 0) {
    app.use(
      rateLimit({
        windowMs: ms(options.limitWindow),
        max: options.limit,
        message: 'Too many requests, please slow down'
      })
    )
  }

  if (options.authToken?.length) {
    app.use(authMiddleware(options.authToken))
  }

  return app
}

export default async function(options: APIOptions, nluVersion: string) {
  const app = createExpressApp(options)
  const logger = new Logger('API')
  const loggerWrapper = makeLoggerWrapper(logger)

  const engine = new Engine('nlu-server', loggerWrapper)
  const modelService = new ModelService(options.modelDir)
  await modelService.init()
  const trainSessionService = new TrainSessionService()
  const trainService = new TrainService(logger, engine, modelService, trainSessionService)

  app.get('/info', (req, res) => {
    res.send({ version: nluVersion })
  })

  const router = express.Router({ mergeParams: true })
  router.post('/train', async (req, res) => {
    try {
      // TODO: add actual validation that all slots reference existing entities
      // and all dollar signs $ reference existing slots
      const input: TrainInput = await validate(req.body, TrainInputCreateSchema, {
        stripUnknown: true
      })

      const { topics, entities, language, password } = input
      const intents = _.flatMap(Object.values(topics))
      const modelHash = engine.computeModelHash(intents, input.entities, input.language)

      const seed = input.seed ?? Math.round(Math.random() * 10000)
      const modelId = modelService.makeModelId(modelHash, input.language, seed)
      const modelFileName = modelService.makeFileName(modelId, password)

      // return the modelId as fast as possible
      // tslint:disable-next-line: no-floating-promises
      trainService.train(modelFileName, intents, entities, language, seed)

      return res.send({ success: true, modelId })
    } catch (err) {
      res.status(500).send({ success: false, error: err.message })
    }
  })

  router.get('/train/:modelId', async (req, res) => {
    try {
      const { modelId } = req.params
      const { password } = req.query
      const modelFileName = modelService.makeFileName(modelId, password ?? '')
      let session = trainSessionService.getTrainingSession(modelFileName)
      if (!session) {
        const model = await modelService.getModel(modelFileName)

        if (!model) {
          return res
            .status(404)
            .send({ success: false, error: `no model or training could be found for modelId: ${modelId}` })
        }

        session = {
          key: modelId,
          status: 'done',
          progress: 1,
          language: model!.languageCode
        }
      }

      res.send({ success: true, session })
    } catch (err) {
      res.status(500).send({ success: false, error: err.message })
    }
  })

  router.post('/train/:modelId/cancel', async (req, res) => {
    try {
      const { modelId } = req.params
      const { password } = req.body
      const modelFileName = modelService.makeFileName(modelId, password ?? '')
      const session = trainSessionService.getTrainingSession(modelFileName)

      if (session?.status === 'training') {
        await engine.cancelTraining(modelFileName)
        return res.send({ success: true })
      }

      res.status(404).send({ success: true, error: `no current training for model id: ${modelId}` })
    } catch (err) {
      res.status(500).send({ success: false, error: err.message })
    }
  })

  router.post('/predict/:modelId', async (req, res) => {
    try {
      const { modelId } = req.params
      const { sentence, password } = req.body
      const modelFileName = modelService.makeFileName(modelId, password ?? '')
      const model = await modelService.getModel(modelFileName)

      if (model) {
        await engine.loadModel(model)

        const prediction = await engine.predict(sentence, [], model?.languageCode!)
        engine.unloadModel(model.languageCode)

        return res.send({ success: true, prediction })
      }

      res.status(404).send({ success: false, error: `modelId ${modelId} can't be found` })
    } catch (err) {
      res.status(404).send({ success: false, error: err.message })
    }
  })

  app.use('/', router)
  app.use(handleErrorLogging)

  const httpServer = createServer(app)

  await Promise.fromCallback(callback => {
    const hostname = options.host === 'localhost' ? undefined : options.host
    httpServer.listen(options.port, hostname, undefined, callback)
  })

  logger.info(`NLU Server is ready at http://${options.host}:${options.port}/`)
}

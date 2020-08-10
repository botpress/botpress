import bodyParser from 'body-parser'
import { NLU } from 'botpress/sdk'
import cors from 'cors'
import express, { Application } from 'express'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { validate } from 'joi'
import _ from 'lodash'
import ms from 'ms'
import Engine from 'nlu-core/engine'

import NLUServerGhost from './ghost'
import { NLUServerLogger } from './logger'
import ModelService from './model-service'
import { monitoringMiddleware, startMonitoring } from './monitoring'
import { authMiddleware, handleErrorLogging, handleUnexpectedError } from './util'
import { TrainInput, TrainInputCreateSchema } from './validation'

export type APIOptions = {
  version: string
  host: string
  port: number
  modelDir: string
  authToken?: string
  limitWindow: string
  limit: number
  adminToken: string
}

const debug = DEBUG('api')
const debugRequest = debug.sub('request')
const cachePolicy = { 'Cache-Control': `max-age=${ms('1d')}` }

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

  app.use(monitoringMiddleware)
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

  if (options.authToken && options.authToken.length) {
    // Both tokens can be used to query the language server
    app.use(authMiddleware(options.authToken, options.adminToken))
  }

  return app
}

export default async function(options: APIOptions) {
  const app = createExpressApp(options)
  const logger = new NLUServerLogger('API')
  const loggerWrapper: NLU.Logger = {
    info: (msg: string) => logger.info(msg),
    warning: (msg: string, err?: Error) => (err ? logger.attachError(err).warn(msg) : logger.warn(msg)),
    error: (msg: string, err?: Error) => (err ? logger.attachError(err).error(msg) : logger.error(msg))
  }
  const engine = new Engine('nlu-server', loggerWrapper)
  const nluGhost = new NLUServerGhost()
  const modelService = new ModelService(nluGhost, options.modelDir)
  await modelService.createModelDirIfNotExist()

  const adminTokenMw = authMiddleware(options.adminToken)

  app.get('/info', (req, res) => {
    res.send({
      version: options.version
    })
  })

  const router = express.Router({ mergeParams: true })
  router.post('/train', async (req, res) => {
    const input: TrainInput = await validate(req.body, TrainInputCreateSchema, {
      stripUnknown: true
    })

    const intents = _.flatMap(Object.values(input.topics))
    const model = await engine.train(intents, input.entities, input.language)

    if (!model) {
      res.sendStatus(500) // an error occured
    }
    const modelId = await modelService.saveModel(model!)
    return res.send({
      modelId
    })
  })

  router.post('/predict/:modelId', async (req, res) => {
    const { modelId } = req.params
    const model = await modelService.getModel(modelId)
    if (model) {
      await engine.loadModel(model) // TODO: think about some way of unloading models

      const { sentence } = req.body
      const prediction = await engine.predict(sentence, [], model?.languageCode!)
      return res.send(prediction)
    }
    res.sendStatus(404) // modelId does not exist
  })

  app.use('/', router)
  app.use(handleErrorLogging)

  const httpServer = createServer(app)

  await Promise.fromCallback(callback => {
    const hostname = options.host === 'localhost' ? undefined : options.host
    httpServer.listen(options.port, hostname, undefined, callback)
  })

  logger.info(`NLU Server is ready at http://${options.host}:${options.port}/`)

  if (process.env.MONITORING_INTERVAL) {
    startMonitoring()
  }
}

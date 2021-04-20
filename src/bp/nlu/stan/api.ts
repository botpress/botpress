import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Application } from 'express'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import _ from 'lodash'
import ms from 'ms'
import * as NLUEngine from 'nlu/engine'

import modelIdService from 'nlu/engine/model-id-service'
import { authMiddleware, handleErrorLogging, handleUnexpectedError } from '../../http-utils'
import Logger from '../../simple-logger'

import { PredictOutput, TrainInput } from '../typings_v1'
import {
  InfoResponseBody,
  ErrorResponse,
  ListModelsResponseBody,
  PruneModelsResponseBody,
  TrainResponseBody,
  TrainProgressResponseBody,
  SuccessReponse,
  PredictResponseBody,
  DetectLangResponseBody
} from './http-typings'
import { ModelRepoOptions, ModelRepository } from './model-repo'
import TrainService from './train-service'
import TrainSessionService from './train-session-service'
import {
  validateCredentialsFormat,
  validatePredictInput,
  validateTrainInput,
  validateDetectLangInput
} from './validation/validate'

export interface APIOptions {
  host: string
  port: number
  authToken?: string
  limitWindow: string
  limit: number
  bodySize: string
  batchSize: number
  silent: boolean
  modelCacheSize: string
  dbURL?: string
}

const debug = DEBUG('api')
const debugRequest = debug.sub('request')

const createExpressApp = (options: APIOptions): Application => {
  const app = express()

  // This must be first, otherwise the /info endpoint can't be called when token is used
  app.use(cors())

  app.use(bodyParser.json({ limit: options.bodySize }))

  app.use((req, res, next) => {
    res.header('X-Powered-By', 'Botpress NLU')
    debugRequest(`incoming ${req.path}`, { ip: req.ip })
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

export default async function(options: APIOptions, engine: NLUEngine.Engine) {
  const app = createExpressApp(options)
  const logger = new Logger('API')

  const { dbURL: databaseURL } = options
  const modelRepoOptions: ModelRepoOptions = databaseURL
    ? {
        driver: 'db',
        dbURL: databaseURL
      }
    : {
        driver: 'fs'
      }

  const modelRepo = new ModelRepository(logger, modelRepoOptions)
  await modelRepo.initialize()
  const trainSessionService = new TrainSessionService()
  const trainService = new TrainService(logger, engine, modelRepo, trainSessionService)

  const router = express.Router({ mergeParams: true })
  router.get('/info', async (req, res) => {
    try {
      const health = engine.getHealth()
      const specs = engine.getSpecifications()
      const languages = engine.getLanguages()

      const info = { health, specs, languages }

      const resp: InfoResponseBody = { success: true, info }
      res.send(resp)
    } catch (err) {
      const resp: ErrorResponse = { success: false, error: err.message }
      res.status(500).send(resp)
    }
  })

  router.get('/models', async (req, res) => {
    try {
      const { appSecret, appId } = await validateCredentialsFormat(req.query)
      const modelIds = await modelRepo.listModels({ appSecret, appId })
      const stringIds = modelIds.map(modelIdService.toString)

      const resp: ListModelsResponseBody = { success: true, models: stringIds }
      return res.send(resp)
    } catch (err) {
      const resp: ErrorResponse = { success: false, error: err.message }
      res.status(500).send(resp)
    }
  })

  router.post('/models/prune', async (req, res) => {
    try {
      const { appSecret, appId } = await validateCredentialsFormat(req.body)
      const modelIds = await modelRepo.pruneModels({ appSecret, appId })

      for (const modelId of modelIds) {
        if (engine.hasModel(modelId)) {
          engine.unloadModel(modelId)
        }
        trainSessionService.deleteTrainingSession(modelId, { appSecret, appId })
      }

      const stringIds = modelIds.map(modelIdService.toString)

      const resp: PruneModelsResponseBody = { success: true, models: stringIds }
      return res.send(resp)
    } catch (err) {
      const resp: ErrorResponse = { success: false, error: err.message }
      res.status(500).send(resp)
    }
  })

  router.post('/train', async (req, res) => {
    try {
      const input = await validateTrainInput(req.body)
      const { intents, entities, seed, language, appSecret, appId } = input

      const pickedSeed = seed ?? Math.round(Math.random() * 10000)

      const trainInput: TrainInput = {
        intents,
        entities,
        language,
        seed: pickedSeed
      }

      const modelId = NLUEngine.modelIdService.makeId({
        ...trainInput,
        specifications: engine.getSpecifications()
      })

      // return the modelId as fast as possible
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      trainService.train(modelId, { appSecret, appId }, trainInput)

      const resp: TrainResponseBody = { success: true, modelId: NLUEngine.modelIdService.toString(modelId) }
      return res.send(resp)
    } catch (err) {
      const resp: ErrorResponse = { success: false, error: err.message }
      res.status(500).send(resp)
    }
  })

  router.get('/train/:modelId', async (req, res) => {
    try {
      const { modelId: stringId } = req.params
      if (!_.isString(stringId) || !NLUEngine.modelIdService.isId(stringId)) {
        return res.status(400).send({ success: false, error: `model id "${stringId}" has invalid format` })
      }

      const { appSecret, appId } = await validateCredentialsFormat(req.query)

      const modelId = NLUEngine.modelIdService.fromString(stringId)
      let session = trainSessionService.getTrainingSession(modelId, { appSecret, appId })
      if (!session) {
        const model = await modelRepo.getModel(modelId, { appSecret, appId })

        if (!model) {
          return res.status(404).send({
            success: false,
            error: `no model or training could be found for modelId: ${stringId}`
          })
        }

        session = {
          status: 'done',
          progress: 1
        }
      }

      const resp: TrainProgressResponseBody = { success: true, session }
      res.send(resp)
    } catch (err) {
      const resp: ErrorResponse = { success: false, error: err.message }
      res.status(500).send(resp)
    }
  })

  router.post('/train/:modelId/cancel', async (req, res) => {
    try {
      const { modelId: stringId } = req.params
      const { appSecret, appId } = await validateCredentialsFormat(req.body)

      const modelId = NLUEngine.modelIdService.fromString(stringId)
      const session = trainSessionService.getTrainingSession(modelId, { appSecret, appId })

      if (session?.status === 'training') {
        await engine.cancelTraining(stringId)
        const resp: SuccessReponse = { success: true }
        return res.send(resp)
      }

      const resp: ErrorResponse = { success: false, error: `no current training for model id: ${stringId}` }
      res.status(404).send(resp)
    } catch (err) {
      const resp: ErrorResponse = { success: false, error: err.message }
      res.status(500).send(resp)
    }
  })

  router.post('/predict/:modelId', async (req, res) => {
    try {
      const { modelId: stringId } = req.params
      const { utterances, appId, appSecret } = await validatePredictInput(req.body)

      if (!_.isArray(utterances) || (options.batchSize > 0 && utterances.length > options.batchSize)) {
        const error = `Batch size of ${utterances.length} is larger than the allowed maximum batch size (${options.batchSize}).`
        const resp: ErrorResponse = { success: false, error }
        return res.status(400).send(resp)
      }

      const modelId = NLUEngine.modelIdService.fromString(stringId)
      // TODO: once the model is loaded, there's no more check to appSecret and appId
      if (!engine.hasModel(modelId)) {
        const model = await modelRepo.getModel(modelId, { appId, appSecret })
        if (!model) {
          const error = `modelId ${stringId} can't be found`
          const resp: ErrorResponse = { success: false, error }
          return res.status(404).send(resp)
        }

        await engine.loadModel(model)
      }

      const predictions = await Promise.map(utterances as string[], async utterance => {
        const detectedLanguage = await engine.detectLanguage(utterance, { [modelId.languageCode]: modelId })
        const { entities, contexts, spellChecked } = await engine.predict(utterance, modelId)
        return { entities, contexts, spellChecked, detectedLanguage }
      })

      const resp: PredictResponseBody = { success: true, predictions }
      res.send(resp)
    } catch (err) {
      const resp: ErrorResponse = { success: false, error: err.message }
      res.status(500).send(resp)
    }
  })

  router.post('/detect-lang', async (req, res) => {
    try {
      const { utterances, appId, appSecret, models } = await validateDetectLangInput(req.body)

      const invalidIds = models.filter(_.negate(modelIdService.isId))
      if (invalidIds.length) {
        return res
          .status(400)
          .send({ success: false, error: `The following model ids are invalid: [${invalidIds.join(', ')}]` })
      }

      const modelIds = models.map(modelIdService.fromString)

      if (!_.isArray(utterances) || (options.batchSize > 0 && utterances.length > options.batchSize)) {
        const error = `Batch size of ${utterances.length} is larger than the allowed maximum batch size (${options.batchSize}).`
        return res.status(400).send({ success: false, error })
      }

      for (const modelId of modelIds) {
        // TODO: once the model is loaded, there's no more check to appSecret and appId
        if (!engine.hasModel(modelId)) {
          const model = await modelRepo.getModel(modelId, { appId, appSecret })
          if (!model) {
            return res.status(404).send({ success: false, error: `modelId ${modelId} can't be found` })
          }
          await engine.loadModel(model)
        }
      }

      const missingModels = modelIds.filter(m => !engine.hasModel(m))

      if (missingModels.length) {
        const stringMissingModels = missingModels.map(modelIdService.toString)
        logger.warn(
          `About to detect language but your model cache seems to small to contains all models simultaneously. The following models are missing [${stringMissingModels.join(
            ', '
          )}. You can increase your cache size by setting the CLI parameter "modelCacheSize".]`
        )
      }

      const loadedModels = modelIds.filter(m => engine.hasModel(m))
      const detectedLanguages: string[] = await Promise.map(utterances, async utterance => {
        const detectedLanguage = await engine.detectLanguage(
          utterance,
          _.keyBy(loadedModels, m => m.languageCode)
        )
        return detectedLanguage
      })

      const resp: DetectLangResponseBody = { success: true, detectedLanguages }
      res.send(resp)
    } catch (err) {
      const resp: ErrorResponse = { success: false, error: err.message }
      res.status(500).send(resp)
    }
  })

  app.use(['/v1', '/'], router)
  app.use(handleErrorLogging)

  const httpServer = createServer(app)

  await Promise.fromCallback(callback => {
    const hostname = options.host === 'localhost' ? undefined : options.host
    httpServer.listen(options.port, hostname, undefined, callback)
  })

  logger.info(`NLU Server is ready at http://${options.host}:${options.port}/`)
  options.silent && logger.silence()
}

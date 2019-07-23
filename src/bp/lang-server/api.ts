import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Application } from 'express'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import _ from 'lodash'
import ms from 'ms'

import { BadRequestError } from '../core/routers/errors'

import { LangServerLogger } from './logger'
import { monitoringMiddleware, startMonitoring } from './monitoring'
import LanguageService from './service'
import DownloadManager from './service/download-manager'
import {
  assertValidLanguage,
  authMiddleware,
  handleErrorLogging,
  handleUnexpectedError,
  isAdminToken,
  RequestWithLang,
  serviceLoadingMiddleware
} from './util'

export type APIOptions = {
  host: string
  port: number
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

export default async function(options: APIOptions, languageService: LanguageService, downloadManager: DownloadManager) {
  const app = createExpressApp(options)
  const logger = new LangServerLogger('API')

  const waitForServiceMw = serviceLoadingMiddleware(languageService)
  const validateLanguageMw = assertValidLanguage(languageService)
  const adminTokenMw = authMiddleware(options.adminToken)

  app.get('/info', (req, res) => {
    res.send({
      version: '1',
      ready: languageService.isReady,
      dimentions: languageService.dim,
      domain: languageService.domain,
      readOnly: !isAdminToken(req, options.adminToken),
      languages: languageService.getModels().filter(x => x.loaded) // TODO remove this from info and make clients use /languages route
    })
  })

  app.post('/tokenize', waitForServiceMw, validateLanguageMw, async (req: RequestWithLang, res, next) => {
    try {
      const utterances = req.body.utterances
      const language = req.language!

      if (!utterances || !_.isArray(utterances) || !utterances.length) {
        // For backward cpompatibility with Botpress 12.0.0 - 12.0.2
        const singleInput = req.body.input
        if (!singleInput || !_.isString(singleInput)) {
          throw new BadRequestError('Param `utterances` is mandatory (must be an array of string)')
        }
        const tokens = await languageService.tokenize([singleInput], language)
        res.set(cachePolicy).json({ input: singleInput, language, tokens: tokens[0] })
      } else {
        const tokens = await languageService.tokenize(utterances, language)
        res.set(cachePolicy).json({ utterances, language, tokens })
      }
    } catch (err) {
      next(err)
    }
  })

  app.post('/vectorize', waitForServiceMw, validateLanguageMw, async (req: RequestWithLang, res, next) => {
    try {
      const tokens = req.body.tokens
      const lang = req.language!

      if (!tokens || !tokens.length || !_.isArray(tokens)) {
        throw new BadRequestError('Param `tokens` is mandatory (must be an array of strings)')
      }

      const result = await languageService.vectorize(tokens, lang)
      res.set(cachePolicy).json({ language: lang, vectors: result })
    } catch (err) {
      next(err)
    }
  })

  const router = express.Router({ mergeParams: true })

  router.get('/', (req, res) => {
    const downloading = downloadManager.inProgress.map(x => ({
      lang: x.lang,
      progress: {
        status: x.getStatus(),
        downloadId: x.id,
        size: x.downloadSizeProgress
      }
    }))

    res.send({
      available: downloadManager.downloadableLanguages,
      installed: languageService.getModels(),
      downloading
    })
  })

  router.post('/:lang', adminTokenMw, async (req, res) => {
    const { lang } = req.params
    try {
      const downloadId = await downloadManager.download(lang)
      res.json({ success: true, downloadId })
    } catch (err) {
      res.status(404).send({ success: false, error: err.message })
    }
  })

  router.delete('/:lang', adminTokenMw, validateLanguageMw, async (req: RequestWithLang, res, next) => {
    await languageService.remove(req.language!)
    res.sendStatus(200)
  })

  router.post('/:lang/load', adminTokenMw, validateLanguageMw, async (req: RequestWithLang, res, next) => {
    try {
      await languageService.loadModel(req.language!)
      res.sendStatus(200)
    } catch (err) {
      res.status(500).send({ success: false, message: err.message })
    }
  })

  router.post('/cancel/:id', adminTokenMw, (req, res) => {
    const { id } = req.params
    downloadManager.cancelAndRemove(id)
    res.status(200).send({ success: true })
  })

  app.use('/languages', waitForServiceMw, router)
  app.use(handleErrorLogging)

  const httpServer = createServer(app)

  await Promise.fromCallback(callback => {
    const hostname = options.host === 'localhost' ? undefined : options.host
    httpServer.listen(options.port, hostname, undefined, callback)
  })

  logger.info(`Language Server is ready at http://${options.host}:${options.port}/`)

  if (process.env.MONITORING_INTERVAL) {
    startMonitoring()
  }
}

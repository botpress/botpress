import bodyParser from 'body-parser'
import { BadRequestError } from 'core/routers/errors'
import cors from 'cors'
import express, { Application } from 'express'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import _ from 'lodash'
import ms from 'ms'

import { monitoringMiddleware, startMonitoring } from './monitoring'
import LanguageService from './service'
import DownloadManager from './service/download-manager'
import {
  assertValidLanguage,
  authMiddleware,
  disabledReadonlyMiddleware,
  handleErrorLogging,
  handleUnexpectedError,
  RequestWithLang,
  serviceLoadingMiddleware
} from './util'

export type APIOptions = {
  host: string
  port: number
  authToken?: string
  limitWindow: string
  limit: number
  readOnly: boolean
}

const debug = DEBUG('api')
const debugRequest = debug.sub('request')
const cachePolicy = { 'Cache-Control': `max-age=${ms('1d')}` }

const createExpressApp = (options: APIOptions): Application => {
  const app = express()

  app.use(bodyParser.json({ limit: '1kb' }))

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
    app.use(authMiddleware(options.authToken))
  }

  return app
}

export default async function(options: APIOptions, languageService: LanguageService, downloadManager: DownloadManager) {
  const app = createExpressApp(options)

  // TODO we might want to set a special cors
  app.use(cors())

  const waitForServiceMw = serviceLoadingMiddleware(languageService)
  const validateLanguageMw = assertValidLanguage(languageService)
  const readOnlyMw = disabledReadonlyMiddleware(options.readOnly)

  app.get('/info', (req, res) => {
    res.send({
      version: '1',
      ready: languageService.isReady,
      dimentions: languageService.dim,
      domain: languageService.domain,
      readOnly: options.readOnly,
      languages: languageService.getModels().filter(x => x.loaded) // TODO remove this from info and make clients use /languages route
    })
  })

  app.post('/tokenize', waitForServiceMw, validateLanguageMw, async (req: RequestWithLang, res, next) => {
    try {
      const input = req.body.input
      const language = req.language!

      if (!input || !_.isString(input)) {
        throw new BadRequestError('Param `input` is mandatory (must be a string)')
      }

      const tokens = await languageService.tokenize(input, language)

      res.set(cachePolicy).json({ input, language, tokens })
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

  router.post('/:lang', readOnlyMw, async (req, res) => {
    const { lang } = req.params
    try {
      const downloadId = await downloadManager.download(lang)
      res.json({ success: true, downloadId })
    } catch (err) {
      res.status(404).send({ success: false, error: err.message })
    }
  })

  router.delete('/:lang', readOnlyMw, validateLanguageMw, async (req: RequestWithLang, res, next) => {
    await languageService.remove(req.language!)
    res.sendStatus(200)
  })

  router.post('/:lang/load', readOnlyMw, validateLanguageMw, async (req: RequestWithLang, res, next) => {
    try {
      await languageService.loadModel(req.language!)
      res.sendStatus(200)
    } catch (err) {
      res.status(500).send({ success: false, message: err.message })
    }
  })

  router.post('/cancel/:id', readOnlyMw, (req, res) => {
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

  console.log(`Language Server is ready at http://${options.host}:${options.port}/`)

  if (process.env.MONITORING_INTERVAL) {
    startMonitoring()
  }
}

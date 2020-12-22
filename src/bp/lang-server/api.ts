import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Application } from 'express'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { authMiddleware, handleErrorLogging, handleUnexpectedError, isAdminToken, RequestWithLang } from 'http-utils'
import _ from 'lodash'
import ms from 'ms'
import yn from 'yn'

import { BadRequestError } from '../core/routers/errors'
import Logger from '../simple-logger'

import { getLanguageByCode } from './languages'
import { monitoringMiddleware, startMonitoring } from './monitoring'
import LanguageService from './service'
import DownloadManager from './service/download-manager'
import { assertValidLanguage, serviceLoadingMiddleware } from './util'

export interface APIOptions {
  version: string
  host: string
  port: number
  authToken?: string
  limitWindow: string
  limit: number
  adminToken: string
}

const OFFLINE_ERR_MSG = 'The server is running in offline mode. This function is disabled.'

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
    debugRequest(`incoming ${req.path}`, { ip: req.ip })
    next()
  })

  app.use(monitoringMiddleware)
  app.use(handleUnexpectedError)

  if (process.core_env.REVERSE_PROXY) {
    const boolVal = yn(process.core_env.REVERSE_PROXY)
    app.set('trust proxy', boolVal === null ? process.core_env.REVERSE_PROXY : boolVal)
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

export default async function(
  options: APIOptions,
  languageService: LanguageService,
  downloadManager?: DownloadManager
) {
  const app = createExpressApp(options)
  const logger = new Logger('API')

  const waitForServiceMw = serviceLoadingMiddleware(languageService)
  const validateLanguageMw = assertValidLanguage(languageService)
  const adminTokenMw = authMiddleware(options.adminToken)

  app.get('/info', (req, res) => {
    res.send({
      version: options.version,
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
        // For backward compatibility with Botpress 12.0.0 - 12.0.2
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
    if (!downloadManager) {
      const localLanguages = languageService.getModels().map(m => {
        const { name } = getLanguageByCode(m.lang)
        return { ...m, code: m.lang, name }
      })

      return res.send({
        available: localLanguages,
        installed: localLanguages,
        downloading: []
      })
    }

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
    if (!downloadManager) {
      return res.status(404).send({ success: false, error: OFFLINE_ERR_MSG })
    }

    try {
      const downloadId = await downloadManager.download(lang)
      res.json({ success: true, downloadId })
    } catch (err) {
      res.status(404).send({ success: false, error: err.message })
    }
  })

  router.post('/:lang/delete', adminTokenMw, validateLanguageMw, async (req: RequestWithLang, res, next) => {
    languageService.remove(req.language!)
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
    if (!downloadManager) {
      return res.send({ success: false, error: OFFLINE_ERR_MSG })
    }

    downloadManager.cancelAndRemove(id)
    res.send({ success: true })
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

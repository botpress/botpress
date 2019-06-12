import bodyParser from 'body-parser'
import { BadRequestError, NotReadyError, UnauthorizedError } from 'core/routers/errors'
import cors from 'cors'
import express, { Application, RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import _ from 'lodash'
import ms from 'ms'

import LanguageService from './service'
import DownloadManager from './service/download-manager'

export type APIOptions = {
  host: string
  port: number
  authToken?: string
  limitWindow: string
  limit: number
  languageService: LanguageService
  downloadManager: DownloadManager
  readOnly: boolean
}

const debug = DEBUG('api')
const debugAuth = debug.sub('auth')
const debugRequest = debug.sub('request')

const authMiddleware: (token: string) => RequestHandler = (token: string) => (req, _res, next) => {
  const header = (req.header('authorization') || '').trim()
  const split = header.indexOf(' ')

  if (split < 0) {
    debugAuth('no authentication', { ip: req.ip })
    throw new UnauthorizedError('You must authenticate to use this API')
  }

  const schema = header.slice(0, split)
  const value = header.slice(split + 1)

  if (schema.toLowerCase() !== 'bearer') {
    debugAuth('invalid schema', { ip: req.ip })
    throw new UnauthorizedError('Unsupported authentication schema (expected `bearer <token>`)')
  }

  if (value !== token) {
    debugAuth('invalid token', { ip: req.ip })
    throw new UnauthorizedError('Invalid Bearer token')
  }

  next()
}

const serviceLoadingMiddleware = (service: LanguageService) => (_req, _res, next) => {
  if (!service.isReady) {
    throw new NotReadyError('language')
  }
  next()
}

const assertValidLanguage = (service: LanguageService) => (req, _res, next) => {
  const language = req.body.lang

  if (!language) {
    throw new BadRequestError(`Param 'lang' is mandatory`)
  }
  if (!_.isString(language)) {
    throw new BadRequestError(`Param 'lang': ${language} must be a string`)
  }

  const availableLanguages = service.getModels().map(x => x.lang)
  if (!availableLanguages.includes(language)) {
    throw new BadRequestError(`Param 'lang': ${language} is not element of the available languages`)
  }

  next()
}

const DisabledReadonlyMiddleware = (readonly: boolean) => (_req, _res, next) => {
  if (readonly) {
    throw new UnauthorizedError('API server is running in read-only mode')
  }
  next()
}

function createExpressApp(options: APIOptions): Application {
  const app = express()

  app.use(
    bodyParser.json({
      limit: '1kb'
    })
  )

  app.use((req, res, next) => {
    res.header('X-Powered-By', 'Botpress')
    debugRequest('incoming ' + req.path, { ip: req.ip })
    next()
  })

  app.use(function handleErrors(err, req, res, next) {
    const statusCode = err.statusCode || 500
    const errorCode = err.errorCode || 'BP_000'
    const message = (err.errorCode && err.message) || 'Unexpected error'
    res.status(statusCode).json({
      statusCode,
      errorCode,
      type: err.type || Object.getPrototypeOf(err).name || 'Exception',
      message
    })
  })

  if (process.core_env.REVERSE_PROXY) {
    app.set('trust proxy', process.core_env.REVERSE_PROXY)
  }

  if (options.limit > 0) {
    const windowMs = ms(options.limitWindow)
    app.use(
      rateLimit({
        windowMs,
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

export default async function(options: APIOptions) {
  const app = createExpressApp(options)

  // TODO we might want to set a special cors policy here ?
  app.use(cors())

  const waitForServiceMw = serviceLoadingMiddleware(options.languageService)
  const validateLanguageMw = assertValidLanguage(options.languageService)

  app.get('/info', (req, res, next) => {
    res.send({
      version: '1',
      ready: options.languageService.isReady,
      dimentions: options.languageService.dim,
      domain: options.languageService.domain,
      readOnly: options.readOnly,
      languages: options.languageService.getModels().filter(x => x.loaded)
    })
  })

  app.post('/tokenize', waitForServiceMw, validateLanguageMw, async (req, res, next) => {
    try {
      const input = req.body.input
      const language = req.body.lang

      if (!input || !_.isString(input)) {
        throw new BadRequestError('Param `input` is mandatory (must be a string)')
      }

      const tokens = await options.languageService.tokenize(input, language)

      res.json({ input, language, tokens })
    } catch (err) {
      next(err)
    }
  })

  app.post('/vectorize', waitForServiceMw, validateLanguageMw, async (req, res, next) => {
    try {
      const tokens = req.body.tokens
      const lang = req.body.lang

      if (!tokens || !tokens.length || !_.isArray(tokens)) {
        throw new BadRequestError('Param `tokens` is mandatory (must be an array of strings)')
      }

      const result = await options.languageService.vectorize(tokens, lang)
      res.json({ language: lang, vectors: result })
    } catch (err) {
      next(err)
    }
  })

  const router = express.Router({ mergeParams: true })
  router.get('/', (req, res) => {
    const downloading = options.downloadManager.inProgress.map(x => ({
      lang: x.lang,
      progress: {
        status: x.getStatus(),
        downloadId: x.id,
        size: x.downloadSizeProgress
      }
    }))

    res.send({
      available: options.downloadManager.downloadableLanguages,
      installed: options.languageService.getModels(),
      downloading
    })
  })

  router.post('/:lang', DisabledReadonlyMiddleware(options.readOnly), async (req, res) => {
    const { lang } = req.params
    try {
      const downloadId = await options.downloadManager.download(lang)
      res.json({ success: true, downloadId })
    } catch (err) {
      res.status(404).send({ success: false, error: err.message })
    }
  })

  router.delete('/:lang', DisabledReadonlyMiddleware(options.readOnly), async (req, res) => {
    const { lang } = req.params
    if (!lang || !options.languageService.getModels().find(x => x.lang === lang)) {
      throw new BadRequestError('Parameter `lang` is mandatory and must be part of the available languages')
    }

    await options.languageService.remove(lang)
    res.end()
  })

  router.post('/:lang/load', DisabledReadonlyMiddleware(options.readOnly), async (req, res) => {
    const { lang } = req.params

    if (!lang || !options.languageService.getModels().find(x => x.lang === lang)) {
      throw new BadRequestError('Parameter `lang` is mandatory and must be part of the available languages')
    }

    try {
      await options.languageService.loadModel(lang)
    } catch (err) {
      res.status(500).send({ success: false, message: err.message })
    }
  })

  router.post('/cancel/:id', DisabledReadonlyMiddleware(options.readOnly), (req, res) => {
    const { id } = req.params
    options.downloadManager.cancelAndRemove(id)
    res.status(200).send({ success: true })
  })

  app.use('/languages', waitForServiceMw, router)

  const httpServer = createServer(app)

  await Promise.fromCallback(callback => {
    httpServer.listen(options.port, options.host, undefined, callback)
  })

  console.log(`Language server ready on '${options.host}' port ${options.port}`)
}

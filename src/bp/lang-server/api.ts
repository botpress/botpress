import bodyParser from 'body-parser'
import { BadRequestError, NotReadyError, UnauthorizedError } from 'core/routers/errors'
import express, { Application, RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import ms from 'ms'
import { isArray } from 'util'

import LanguageService from './service'

export type APIOptions = {
  host: string
  port: number
  authToken?: string
  limitWindow: string
  limit: number
  service: LanguageService
}

const debug = DEBUG('api')
const debugAuth = debug.sub('auth')
const debugRequest = debug.sub('request')

const AuthMiddleware: (token: string) => RequestHandler = (token: string) => (req, _res, next) => {
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

const ServiceLoadingMiddleware = (service: LanguageService) => (_req, _res, next) => {
  if (!service.isReady()) {
    throw new NotReadyError('language')
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

  if (options.authToken && options.authToken.length >= 1) {
    app.use(AuthMiddleware(options.authToken))
  }

  return app
}

export default async function(options: APIOptions) {
  const app = createExpressApp(options)
  const waitForServiceMw = ServiceLoadingMiddleware(options.service)

  app.get('/info', (req, res, next) => {
    res.send({
      version: '1',
      ready: options.service.isReady(),
      languages: options.service
        .listModels()
        .filter(x => x.loaded)
        .map(x => x.name)
    })
  })

  app.post('/vectorize', waitForServiceMw, async (req, res, next) => {
    try {
      const tokens = req.body.tokens
      const lang = req.body.lang || 'en'

      if (!tokens || !tokens.length || !isArray(tokens)) {
        throw new BadRequestError('Param `tokens` is mandatory (must be an array of strings)')
      }

      const result = await options.service.vectorize(tokens, lang)
      res.json({ input: tokens, language: lang, vectors: result })
    } catch (err) {
      next(err)
    }
  })

  const httpServer = createServer(app)
  await Promise.fromCallback(callback => {
    httpServer.listen(options.port, options.host, undefined, callback)
  })

  console.log(`Language server ready on '${options.host}' port ${options.port}`)
}

import bodyParser from 'body-parser'
import { Logger } from 'botpress/runtime-sdk'
import compression from 'compression'
import cors from 'cors'
import errorHandler from 'errorhandler'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { createServer, Server } from 'http'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import ms from 'ms'
import portFinder from 'portfinder'
import { TYPES } from 'runtime/app/types'
import { BotService } from 'runtime/bots'
import { ConfigProvider } from 'runtime/config'
import { ConverseService } from 'runtime/converse'
import { EventEngine, EventRepository } from 'runtime/events'
import { AppLifecycle, AppLifecycleEvents } from 'runtime/lifecycle'
import { MessagingRouter, MessagingService } from 'runtime/messaging'
import yn from 'yn'

import { ManageRouter } from './manage-router'
import { debugRequestMw } from './server-utils'

@injectable()
export class HTTPServer {
  public httpServer!: Server
  public readonly app: express.Express
  private isBotpressReady = false

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Logger)
    @tagged('name', 'HTTP')
    private logger: Logger,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.EventRepository) private eventRepo: EventRepository,
    @inject(TYPES.ConverseService) private converseService: ConverseService,
    @inject(TYPES.MessagingService) private messaging: MessagingService,
    @inject(TYPES.BotService) private botService: BotService
  ) {
    this.app = express()

    if (!process.IS_PRODUCTION) {
      this.app.use(errorHandler())
    }

    if (process.core_env.REVERSE_PROXY) {
      const boolVal = yn(process.core_env.REVERSE_PROXY)
      this.app.set('trust proxy', boolVal === null ? process.core_env.REVERSE_PROXY : boolVal)
    }

    this.app.use(debugRequestMw)

    if (!yn(process.core_env.BP_HTTP_DISABLE_GZIP)) {
      this.app.use(compression())
    }
  }

  async start() {
    const app = express()
    app.use('/', this.app)
    this.httpServer = createServer(app)

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    AppLifecycle.waitFor(AppLifecycleEvents.BOTPRESS_READY).then(() => {
      this.isBotpressReady = true
    })

    const runtimeConfig = await this.configProvider.getRuntimeConfig()
    const config = runtimeConfig.httpServer!

    this.app.use((req, res, next) => {
      res.removeHeader('X-Powered-By') // Removes the default X-Powered-By: Express
      res.set(config.headers)
      if (!this.isBotpressReady) {
        return res
          .status(503)
          .send(
            '<html><head><meta http-equiv="refresh" content="2"> </head><body>Botpress is loading. Please try again in a minute.</body></html>'
          )
      }
      next()
    })

    this.app.use((req, res, next) => {
      bodyParser.json({ limit: config.bodyLimit })(req, res, next)
    })

    this.app.use((req, res, next) => {
      bodyParser.urlencoded({ extended: true })(req, res, next)
    })

    if (config.cors?.enabled) {
      this.app.use(cors(config.cors))
    }

    if (config.rateLimit?.enabled) {
      this.app.use(
        rateLimit({
          windowMs: ms(config.rateLimit.limitWindow),
          max: config.rateLimit.limit,
          message: 'Too many requests, please slow down.'
        })
      )
    }

    this.app.get('/status', async (req, res, next) => {
      res.send({ botpress: 'up' })
    })

    this.app.get('/version', async (req, res) => {
      res.send(process.BOTPRESS_VERSION)
    })

    const manageRouter = new ManageRouter(this.logger, this.botService, this)
    this.app.use('/manage', manageRouter.router)

    const messagingRouter = new MessagingRouter(this.logger, this.messaging)
    this.app.use('/api/v1/chat', messagingRouter.router)

    this.app.use(function handleUnexpectedError(err, req, res, next) {
      const statusCode = err.statusCode || 400
      const errorCode = err.errorCode
      const message = err.message || err || 'Unexpected error'
      const details = err.details || ''
      const docs = err.docs || 'https://botpress.com/docs'
      const devOnly = process.IS_PRODUCTION ? {} : { showStackInDev: true, stack: err.stack, full: err.message }

      res.status(statusCode).json({
        statusCode,
        errorCode,
        type: err.type || Object.getPrototypeOf(err).name || 'Exception',
        message,
        details,
        docs,
        ...devOnly
      })
    })

    this.app.get('/', (req, res) => {
      res.send('')
    })

    process.HOST = config.host
    process.PORT = await portFinder.getPortPromise({ port: config.port })
    process.EXTERNAL_URL = process.env.EXTERNAL_URL || config.externalUrl || `http://${process.HOST}:${process.PORT}`
    process.LOCAL_URL = `http://${process.HOST}:${process.PORT}`

    if (process.PORT !== config.port) {
      this.logger.warn(`Configured port ${config.port} is already in use. Using next port available: ${process.PORT}`)
    }

    if (!process.env.EXTERNAL_URL && !config.externalUrl) {
      this.logger.warn(
        `External URL is not configured. Using default value of ${process.EXTERNAL_URL}. Some features may not work properly`
      )
    }

    const hostname = config.host === 'localhost' ? undefined : config.host
    await Promise.fromCallback(callback => {
      this.httpServer.listen(process.PORT, hostname, config.backlog, callback)
    })

    return this.app
  }
}

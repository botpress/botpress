import bodyParser from 'body-parser'
import { Logger } from 'botpress/sdk'
import { CSRF_TOKEN_HEADER_LC } from 'common/auth'
import { machineUUID } from 'common/stats'
import { RequestWithUser } from 'common/typings'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import session from 'cookie-session'
import { TYPES } from 'core/app/types'
import { BotService, BotsRouter } from 'core/bots'
import { GhostService, MemoryObjectCache } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { ConfigProvider } from 'core/config'
import { FlowService, SkillService } from 'core/dialog'
import { MediaServiceProvider } from 'core/media'
import { ModuleLoader, ModulesRouter } from 'core/modules'
import { monitoringMiddleware } from 'core/routers'
import { AuthService } from 'core/security'
import { ActionService, ActionServersService, HintsService } from 'core/user-code'
import { WorkspaceService } from 'core/users'
import cors from 'cors'
import errorHandler from 'errorhandler'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { createServer, Server } from 'http'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import jwksRsa from 'jwks-rsa'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import ms from 'ms'
import path from 'path'
import portFinder from 'portfinder'
import { StudioRouter } from 'studio/studio-router'
import { URL } from 'url'
import yn from 'yn'

import { debugRequestMw, resolveAsset } from './server-utils'

const BASE_API_PATH = '/api/v1'

@injectable()
export class HTTPServer {
  public httpServer!: Server
  public readonly app: express.Express
  private isBotpressReady = false
  private machineId!: string

  private readonly botsRouter: BotsRouter
  private readonly studioRouter!: StudioRouter
  private readonly modulesRouter: ModulesRouter

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Logger)
    @tagged('name', 'HTTP')
    private logger: Logger,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.FlowService) flowService: FlowService,
    @inject(TYPES.ActionService) actionService: ActionService,
    @inject(TYPES.ActionServersService) actionServersService: ActionServersService,
    @inject(TYPES.ModuleLoader) moduleLoader: ModuleLoader,
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.MediaServiceProvider) mediaServiceProvider: MediaServiceProvider,
    @inject(TYPES.SkillService) skillService: SkillService,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.HintsService) hintsService: HintsService,
    @inject(TYPES.WorkspaceService) private workspaceService: WorkspaceService,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.ObjectCache) private objectCache: MemoryObjectCache
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

    this.modulesRouter = new ModulesRouter(this.logger, this.authService, moduleLoader, skillService)

    this.studioRouter = new StudioRouter(
      logger,
      authService,
      workspaceService,
      botService,
      configProvider,
      actionService,
      cmsService,
      flowService,
      ghostService,
      mediaServiceProvider,
      actionServersService,
      hintsService,
      objectCache,
      this
    )

    this.botsRouter = new BotsRouter(botService, configProvider, authService, workspaceService, this.logger)
  }

  async setupRootPath() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const externalUrl = process.env.EXTERNAL_URL || botpressConfig.httpServer.externalUrl

    if (!externalUrl) {
      process.ROOT_PATH = ''
    } else {
      const pathname = new URL(externalUrl).pathname
      process.ROOT_PATH = pathname.replace(/\/+$/, '')
    }
  }

  @postConstruct()
  async initialize() {
    this.machineId = await machineUUID()
    await AppLifecycle.waitFor(AppLifecycleEvents.CONFIGURATION_LOADED)
    await this.setupRootPath()

    const app = express()
    app.use(process.ROOT_PATH, this.app)
    this.httpServer = createServer(app)

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    AppLifecycle.waitFor(AppLifecycleEvents.BOTPRESS_READY).then(() => {
      this.isBotpressReady = true
    })
  }

  async getCommonEnv() {
    const config = await this.configProvider.getBotpressConfig()

    return `
    window.SEND_USAGE_STATS = ${config!.sendUsageStats};
    window.USE_JWT_COOKIES = ${process.USE_JWT_COOKIES};
    window.EXPERIMENTAL = ${config.experimental};
    window.SHOW_POWERED_BY = ${!!config.showPoweredBy};
    window.UUID = "${this.machineId}"`
  }

  async start() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.httpServer

    process.USE_JWT_COOKIES = yn(botpressConfig.jwtToken.useCookieStorage)

    /**
     * The loading of language models can take some time, access to Botpress is disabled until it is completed
     * During this time, internal calls between modules can be made
     */
    this.app.use((req, res, next) => {
      res.removeHeader('X-Powered-By') // Removes the default X-Powered-By: Express
      res.set(config.headers)
      if (!this.isBotpressReady) {
        if (
          !(req.headers['user-agent'] || '').includes('axios') ||
          (!req.headers.authorization && !req.headers[CSRF_TOKEN_HEADER_LC])
        ) {
          return res
            .status(503)
            .send(
              '<html><head><meta http-equiv="refresh" content="2"> </head><body>Botpress is loading. Please try again in a minute.</body></html>'
            )
        }
      }
      next()
    })

    this.app.use(monitoringMiddleware)

    if (config.session && config.session.enabled) {
      this.app.use(
        session({
          secret: process.APP_SECRET,
          secure: true,
          httpOnly: true,
          domain: config.externalUrl,
          maxAge: ms(config.session.maxAge)
        })
      )
    }

    if (process.USE_JWT_COOKIES) {
      this.app.use(cookieParser())
    }

    const target = `http://localhost:${process.core_env.CORE_PORT}`
    const proxyPaths = ['/api/v1/bots/*/nlu']

    this.app.use(proxyPaths, createProxyMiddleware({ target, changeOrigin: true, logLevel: 'silent' }))

    this.app.use(bodyParser.json({ limit: config.bodyLimit }))
    this.app.use(bodyParser.urlencoded({ extended: true }))

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

    this.app.use('/', (req, res) => {
      res.redirect(`${process.env.EXTERNAL_URL}`)
    })

    this.app.use('/assets', this.guardWhiteLabel(), express.static(resolveAsset('')))
    this.app.use(`${BASE_API_PATH}/studio/modules`, this.modulesRouter.router)

    await this.botsRouter.setupRoutes(this.app)
    await this.studioRouter.setupRoutes(this.app)

    this.app.use((err, _req, _res, next) => {
      if (err.statusCode === 413) {
        this.logger.error('You may need to increase httpServer.bodyLimit in file data/global/botpress.config.json')
      }
      next(err)
    })

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

    process.PORT = await portFinder.getPortPromise({ port: process.core_env.STUDIO_PORT || config.port })
    process.LOCAL_URL = `http://localhost:${process.PORT}${process.ROOT_PATH}`

    await Promise.fromCallback(callback => {
      this.httpServer.listen(process.PORT, undefined, config.backlog, callback)
    })

    return this.app
  }

  private guardWhiteLabel() {
    return (req, res, next) => {
      if (path.normalize(req.path) === '/custom-theme.css' && (!process.IS_PRO_ENABLED || !process.IS_LICENSED)) {
        return res.sendStatus(404)
      }
      next()
    }
  }
}

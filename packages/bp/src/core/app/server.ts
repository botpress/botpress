import AdminRouter from 'admin/admin-router'
import bodyParser from 'body-parser'
import { AxiosBotConfig, AxiosOptions, http, Logger, RouterOptions } from 'botpress/sdk'
import { CSRF_TOKEN_HEADER_LC, CSRF_TOKEN_HEADER, JWT_COOKIE_NAME } from 'common/auth'
import LicensingService from 'common/licensing-service'
import { machineUUID } from 'common/stats'
import { RequestWithUser } from 'common/typings'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import session from 'cookie-session'
import { TYPES } from 'core/app/types'
import { BotService, BotsRouter } from 'core/bots'
import { GhostService, MemoryObjectCache } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { ExternalAuthConfig, ConfigProvider } from 'core/config'
import { ConverseService } from 'core/converse'
import { FlowService, SkillService } from 'core/dialog'
import { JobService } from 'core/distributed'
import { EventRepository } from 'core/events'
import { AlertingService, MonitoringService } from 'core/health'
import { LogsRepository } from 'core/logger'
import { MediaServiceProvider, MediaRouter } from 'core/media'
import { MessagingRouter, MessagingService } from 'core/messaging'
import { ModuleLoader, ModulesRouter } from 'core/modules'
import { QnaService } from 'core/qna'
import { getSocketTransports, RealtimeService } from 'core/realtime'
import { InvalidExternalToken, PaymentRequiredError, monitoringMiddleware } from 'core/routers'
import {
  generateUserToken,
  hasPermissions,
  needPermissions,
  AuthStrategies,
  AuthService,
  EXTERNAL_AUTH_HEADER,
  SERVER_USER,
  TOKEN_AUDIENCE
} from 'core/security'
import { TelemetryRouter, TelemetryRepository } from 'core/telemetry'
import { ActionService, ActionServersService, HintsService } from 'core/user-code'
import { WorkspaceService } from 'core/users'
import cors from 'cors'
import errorHandler from 'errorhandler'
import { UnlicensedError } from 'errors'
import express, { NextFunction, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { createServer, Server } from 'http'
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import ms from 'ms'
import { MessageType } from 'orchestrator'
import path from 'path'
import portFinder from 'portfinder'
import { URL } from 'url'
import yn from 'yn'

import { isDisabled } from '../routers/conditionalMiddleware'
import { SdkApiRouter } from '../routers/sdk/router'
import { ShortLinksRouter } from '../routers/shortlinks'
import { NLUService } from '../services/nlu/nlu-service'
import { InternalRouter } from './internal-router'
import { debugRequestMw, resolveAsset, resolveIndexPaths } from './server-utils'

const BASE_API_PATH = '/api/v1'
const SERVER_USER_STRATEGY = 'default' // The strategy isn't validated for the userver user, it could be anything.

@injectable()
export class HTTPServer {
  public httpServer!: Server
  public readonly app: express.Express
  private isBotpressReady = false
  private machineId!: string

  private readonly adminRouter: AdminRouter
  private readonly botsRouter: BotsRouter
  private readonly modulesRouter: ModulesRouter
  private readonly shortLinksRouter: ShortLinksRouter
  private telemetryRouter!: TelemetryRouter
  private mediaRouter: MediaRouter
  private readonly sdkApiRouter!: SdkApiRouter
  private internalRouter: InternalRouter
  private messagingRouter: MessagingRouter
  private _needPermissions: (
    operation: string,
    resource: string
  ) => (req: RequestWithUser, res: Response, next: NextFunction) => Promise<void>
  private _hasPermissions: (
    req: RequestWithUser,
    operation: string,
    resource: string,
    noAudit?: boolean
  ) => Promise<boolean>

  private jwksClient?: jwksRsa.JwksClient
  private jwksKeyId?: string

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Logger)
    @tagged('name', 'HTTP')
    private logger: Logger,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.FlowService) flowService: FlowService,
    @inject(TYPES.ActionService) actionService: ActionService,
    @inject(TYPES.ActionServersService) actionServersService: ActionServersService,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.MediaServiceProvider) mediaServiceProvider: MediaServiceProvider,
    @inject(TYPES.SkillService) skillService: SkillService,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.HintsService) hintsService: HintsService,
    @inject(TYPES.LicensingService) licenseService: LicensingService,
    @inject(TYPES.ConverseService) converseService: ConverseService,
    @inject(TYPES.WorkspaceService) private workspaceService: WorkspaceService,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.AuthStrategies) authStrategies: AuthStrategies,
    @inject(TYPES.MonitoringService) private monitoringService: MonitoringService,
    @inject(TYPES.AlertingService) private alertingService: AlertingService,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.LogsRepository) private logsRepo: LogsRepository,
    @inject(TYPES.NLUService) nluService: NLUService,
    @inject(TYPES.TelemetryRepository) private telemetryRepo: TelemetryRepository,
    @inject(TYPES.RealtimeService) private realtime: RealtimeService,
    @inject(TYPES.QnaService) private qnaService: QnaService,
    @inject(TYPES.MessagingService) private messagingService: MessagingService,
    @inject(TYPES.ObjectCache) private objectCache: MemoryObjectCache,
    @inject(TYPES.EventRepository) private eventRepo: EventRepository
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

    this.modulesRouter = new ModulesRouter(
      this.logger,
      this.authService,
      moduleLoader,
      skillService,
      this.configProvider
    )

    this.adminRouter = new AdminRouter(
      logger,
      authService,
      workspaceService,
      botService,
      licenseService,
      ghostService,
      configProvider,
      monitoringService,
      alertingService,
      moduleLoader,
      jobService,
      logsRepo,
      authStrategies,
      messagingService,
      this
    )

    this.shortLinksRouter = new ShortLinksRouter(this.logger)
    this.botsRouter = new BotsRouter(
      botService,
      configProvider,
      authService,
      workspaceService,
      nluService,
      converseService,
      this.logger,
      mediaServiceProvider,
      eventRepo,
      qnaService,
      this
    )
    this.sdkApiRouter = new SdkApiRouter(this.logger)
    this.telemetryRouter = new TelemetryRouter(this.logger, this.authService, this.telemetryRepo)
    this.mediaRouter = new MediaRouter(
      this.logger,
      this.authService,
      this.workspaceService,
      mediaServiceProvider,
      this.configProvider
    )

    this.internalRouter = new InternalRouter(
      this.cmsService,
      this.logger,
      this.moduleLoader,
      this.realtime,
      this.objectCache,
      this.botService,
      this
    )

    this.messagingRouter = new MessagingRouter(this.logger, messagingService, this)

    this._needPermissions = needPermissions(this.workspaceService)
    this._hasPermissions = hasPermissions(this.workspaceService)

    // Necessary to prevent circular dependency
    this.authService.jobService = this.jobService
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

    const botpressConfig = await this.configProvider.getBotpressConfig()
    process.USE_JWT_COOKIES = yn(botpressConfig.jwtToken.useCookieStorage)

    const app = express()
    app.use(process.ROOT_PATH, this.app)
    this.httpServer = createServer(app)

    await this.mediaRouter.initialize()

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    AppLifecycle.waitFor(AppLifecycleEvents.BOTPRESS_READY).then(() => {
      this.isBotpressReady = true
    })
  }

  async getCommonEnv() {
    const config = await this.configProvider.getBotpressConfig()

    return `
        window.API_PATH = "${process.ROOT_PATH}/api/v1";
        window.TELEMETRY_URL = "${process.TELEMETRY_URL}";
        window.EXTERNAL_URL = "${process.EXTERNAL_URL}";
        window.SEND_USAGE_STATS = ${config!.sendUsageStats};
        window.USE_JWT_COOKIES = ${process.USE_JWT_COOKIES};
        window.EXPERIMENTAL = ${config.experimental};
        window.SOCKET_TRANSPORTS = ${JSON.stringify(getSocketTransports(config))}
        window.SHOW_POWERED_BY = ${!!config.showPoweredBy};
        window.UUID = "${this.machineId}";
        window.SERVER_ID = "${process.SERVER_ID}";
    `
  }

  async setupStudioProxy() {
    const target = `http://localhost:${process.STUDIO_PORT}`
    const proxyPaths = ['*/studio/*', '*/api/v1/studio*']

    this.app.use(
      proxyPaths,
      createProxyMiddleware({
        target,
        changeOrigin: true,
        logLevel: 'silent',
        // Fix post requests when the middleware is added after the body parser mw
        onProxyReq: fixRequestBody
      })
    )
  }

  async start() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.httpServer
    await this.sdkApiRouter.initialize()

    await this.messagingService.proxy.setup(this.app, BASE_API_PATH)

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

    this.app.use((req, res, next) => {
      if (!isDisabled('bodyParserJson', req)) {
        bodyParser.json({ limit: config.bodyLimit })(req, res, next)
      } else {
        next()
      }
    })

    this.app.use((req, res, next) => {
      if (!isDisabled('bodyParserUrlEncoder', req)) {
        bodyParser.urlencoded({ extended: true })(req, res, next)
      } else {
        next()
      }
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
      res.send(await this.monitoringService.getStatus())
    })

    this.app.get('/version', async (req, res) => {
      res.send(process.BOTPRESS_VERSION)
    })

    this.setupUILite(this.app)
    this.adminRouter.setupRoutes(this.app)
    await this.botsRouter.setupRoutes(this.app)
    this.internalRouter.setupRoutes()
    this.messagingRouter.setupRoutes()

    this.app.use('/assets', this.guardWhiteLabel(), express.static(resolveAsset('')))

    this.app.use('/api/internal', this.internalRouter.router)
    this.app.use(`${BASE_API_PATH}/chat`, this.messagingRouter.router)
    this.app.use(`${BASE_API_PATH}/modules`, this.modulesRouter.router)

    this.app.use(`${BASE_API_PATH}/sdk`, this.sdkApiRouter.router)
    this.app.use(`${BASE_API_PATH}/telemetry`, this.telemetryRouter.router)
    this.app.use(`${BASE_API_PATH}/media`, this.mediaRouter.router)
    this.app.use('/s', this.shortLinksRouter.router)

    this.app.use((err, _req, _res, next) => {
      if (err instanceof UnlicensedError) {
        next(new PaymentRequiredError(`Server is unlicensed "${err.message}"`))
      } else {
        if (err.statusCode === 413) {
          this.logger.error('You may need to increase httpServer.bodyLimit in file data/global/botpress.config.json')
        }
        next(err)
      }
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

    process.HOST = config.host
    process.PORT = await portFinder.getPortPromise({ port: config.port })
    process.EXTERNAL_URL = process.env.EXTERNAL_URL || config.externalUrl || `http://${process.HOST}:${process.PORT}`
    process.LOCAL_URL = `http://${process.HOST}:${process.PORT}${process.ROOT_PATH}`

    process.send!({ type: MessageType.RegisterProcess, processType: 'web', port: process.PORT })

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

  private setupUILite(app) {
    app.get('/lite/:botId/env.js', async (req, res) => {
      const branding = await this.configProvider.getBrandingConfig('webchat')
      const { botId } = req.params

      const bot = await this.botService.findBotById(botId)
      if (!bot) {
        return res.sendStatus(404)
      }

      const commonEnv = await this.getCommonEnv()
      const totalEnv = `
          (function(window) {
              ${commonEnv}
              window.APP_NAME = "${branding.title}";
              window.APP_FAVICON = "${branding.favicon}";
              window.APP_CUSTOM_CSS = "${branding.customCss}";
              window.BOT_API_PATH = "${process.ROOT_PATH}/api/v1/bots/${botId}";
            })(typeof window != 'undefined' ? window : {})
          `

      res.contentType('text/javascript')
      res.send(totalEnv)
    })

    app.use('/:app(lite)/:botId?', express.static(resolveAsset('ui-lite/public'), { index: false }))
    app.use('/:app(lite)/:botId?', resolveIndexPaths('ui-lite/public/index.html'))
  }

  private guardWhiteLabel() {
    return (req, res, next) => {
      if (path.normalize(req.path) === '/custom-theme.css' && (!process.IS_PRO_ENABLED || !process.IS_LICENSED)) {
        return res.sendStatus(404)
      }
      next()
    }
  }

  createRouterForBot(router: string, identity: string, options: RouterOptions): any & http.RouterExtension {
    return this.botsRouter.getNewRouter(router, identity, options)
  }

  needPermission(operation: string, resource: string) {
    return this._needPermissions(operation, resource)
  }

  hasPermission(req: RequestWithUser, operation: string, resource: string, noAudit?: boolean) {
    return this._hasPermissions(req, operation, resource, noAudit)
  }

  deleteRouterForBot(router: string): void {
    return this.botsRouter.deleteRouter(router, this.app)
  }

  createShortLink(name: string, destination: string, params: any) {
    this.shortLinksRouter.createShortLink(name, destination, params)
  }

  deleteShortLink(name: string) {
    this.shortLinksRouter.deleteShortLink(name)
  }

  async getAxiosConfigForBot(botId: string, options?: AxiosOptions): Promise<AxiosBotConfig> {
    const basePath = options?.localUrl ? process.LOCAL_URL : process.EXTERNAL_URL
    const serverToken = generateUserToken({
      email: SERVER_USER,
      strategy: SERVER_USER_STRATEGY,
      tokenVersion: 1,
      isSuperAdmin: false,
      expiresIn: '5m',
      audience: TOKEN_AUDIENCE
    })

    return {
      baseURL: options?.studioUrl ? `${basePath}/api/v1/studio/${botId}` : `${basePath}/api/v1/bots/${botId}`,
      headers: {
        ...(process.USE_JWT_COOKIES
          ? { Cookie: `${JWT_COOKIE_NAME}=${serverToken.jwt};`, [CSRF_TOKEN_HEADER]: serverToken.csrf }
          : { Authorization: `Bearer ${serverToken.jwt}` })
      }
    }
  }

  extractExternalToken = async (req, res, next) => {
    if (req.headers[EXTERNAL_AUTH_HEADER]) {
      try {
        req.credentials = await this.decodeExternalToken(req.headers[EXTERNAL_AUTH_HEADER])
      } catch (error) {
        return next(new InvalidExternalToken(error.message))
      }
    }

    next()
  }

  async decodeExternalToken(externalToken): Promise<any | undefined> {
    const externalAuth = await this._getExternalAuthConfig()

    if (!externalAuth || !externalAuth.enabled) {
      return
    }

    const { audience, algorithms, issuer } = externalAuth
    let publicKey = externalAuth.publicKey

    if (this.jwksClient && this.jwksKeyId) {
      try {
        const key = await Promise.fromCallback<jwksRsa.SigningKey>(cb =>
          this.jwksClient!.getSigningKey(this.jwksKeyId!, cb)
        )
        publicKey = key.getPublicKey()
      } catch (err) {
        return new Error(`There was an error while trying to fetch the jwks keys. ${err}`)
      }
    }

    const [scheme, token] = externalToken.split(' ')
    if (scheme.toLowerCase() !== 'bearer') {
      return new Error(`Unknown scheme "${scheme}"`)
    }

    return Promise.fromCallback(cb => {
      jsonwebtoken.verify(token, publicKey!, { issuer, audience, algorithms }, (err, user) => {
        cb(err, !err ? user : undefined)
      })
    })
  }

  @Memoize()
  private async _getExternalAuthConfig(): Promise<ExternalAuthConfig | undefined> {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.pro.externalAuth

    if (!config || !config.enabled) {
      return
    }

    if (config.jwksClient) {
      const { keyId, jwksUri } = config.jwksClient

      if (!keyId || !jwksUri) {
        this.logger.error(
          "External User Auth: Couldn't configure the JWKS Client. They keyId and jwksUri parameters must be set"
        )
        return
      }

      this.jwksClient = jwksRsa(config.jwksClient)
      this.jwksKeyId = config.jwksClient.keyId
    } else if (!config.publicKey) {
      try {
        config.publicKey = await this.ghostService.global().readFileAsString('/', 'end_users_auth.pub')
      } catch (error) {
        this.logger
          .attachError(error)
          .error("External User Auth: Couldn't open public key file /data/global/end_users_auth.pub")
        return
      }
    } else if (config.publicKey.length < 128) {
      this.logger.error('External User Auth: The provided publicKey is invalid (too short). Min length is 128 chars.')
      return
    }

    return config
  }
}

import AdminRouter from 'admin/admin-router'
import bodyParser from 'body-parser'
import { AxiosBotConfig, AxiosOptions, http, Logger, RouterOptions } from 'botpress/sdk'
import { CSRF_TOKEN_HEADER_LC, CSRF_TOKEN_HEADER, JWT_COOKIE_NAME } from 'common/auth'
import LicensingService from 'common/licensing-service'
import { RequestWithUser } from 'common/typings'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import session from 'cookie-session'
import { BotService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import { CMSRouter, CMSService } from 'core/cms'
import { ExternalAuthConfig, ConfigProvider } from 'core/config'
import { ConverseRouter, ConverseService } from 'core/converse'
import { FlowService, SkillService } from 'core/dialog'
import { JobService } from 'core/distributed'
import { AlertingService, MonitoringService } from 'core/health'
import { LogsService, LogsRepository } from 'core/logger'
import { MediaServiceProvider, MediaRouter } from 'core/media'
import { ModuleLoader, ModulesRouter } from 'core/modules'
import { NotificationsService } from 'core/notifications'
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
import { ActionService, ActionServersService, HintsService, HintsRouter } from 'core/user-code'
import { WorkspaceService } from 'core/users'
import cors from 'cors'
import errorHandler from 'errorhandler'
import { UnlicensedError } from 'errors'
import express, { NextFunction, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { Request } from 'express-serve-static-core'
import rewrite from 'express-urlrewrite'
import fs from 'fs'
import { createServer, Server } from 'http'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import ms from 'ms'
import path from 'path'
import portFinder from 'portfinder'
import { URL } from 'url'
import yn from 'yn'

import { BotsRouter } from '../routers'
import { NLURouter } from '../routers/bots/nlu'
import { isDisabled } from '../routers/conditionalMiddleware'
import { SdkApiRouter } from '../routers/sdk/router'
import { ShortLinksRouter } from '../routers/shortlinks'
import { NLUService } from '../services/nlu/nlu-service'
import { TYPES } from './types'

const BASE_API_PATH = '/api/v1'
const SERVER_USER_STRATEGY = 'default' // The strategy isn't validated for the userver user, it could be anything.

const debug = DEBUG('api')
const debugRequest = debug.sub('request')

const debugRequestMw = (req: Request, _res, next) => {
  debugRequest(`${req.path} %o`, {
    method: req.method,
    ip: req.ip,
    originalUrl: req.originalUrl
  })

  next()
}

@injectable()
export class HTTPServer {
  public httpServer!: Server
  public readonly app: express.Express
  private isBotpressReady = false

  private readonly adminRouter: AdminRouter
  private readonly botsRouter: BotsRouter
  private cmsRouter!: CMSRouter
  private nluRouter!: NLURouter
  private readonly modulesRouter: ModulesRouter
  private readonly shortLinksRouter: ShortLinksRouter
  private converseRouter!: ConverseRouter
  private hintsRouter!: HintsRouter
  private telemetryRouter!: TelemetryRouter
  private mediaRouter: MediaRouter
  private readonly sdkApiRouter!: SdkApiRouter
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
  private indexCache: { [pageUrl: string]: string } = {}

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
    @inject(TYPES.ModuleLoader) moduleLoader: ModuleLoader,
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.MediaServiceProvider) mediaServiceProvider: MediaServiceProvider,
    @inject(TYPES.LogsService) logsService: LogsService,
    @inject(TYPES.NotificationsService) notificationService: NotificationsService,
    @inject(TYPES.SkillService) skillService: SkillService,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.HintsService) private hintsService: HintsService,
    @inject(TYPES.LicensingService) licenseService: LicensingService,
    @inject(TYPES.ConverseService) private converseService: ConverseService,
    @inject(TYPES.WorkspaceService) private workspaceService: WorkspaceService,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.AuthStrategies) private authStrategies: AuthStrategies,
    @inject(TYPES.MonitoringService) private monitoringService: MonitoringService,
    @inject(TYPES.AlertingService) private alertingService: AlertingService,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.LogsRepository) private logsRepo: LogsRepository,
    @inject(TYPES.NLUService) private nluService: NLUService,
    @inject(TYPES.TelemetryRepository) private telemetryRepo: TelemetryRepository
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
      this.logger,
      this.authService,
      this.workspaceService,
      this.botService,
      licenseService,
      this.ghostService,
      this.configProvider,
      this.monitoringService,
      this.alertingService,
      moduleLoader,
      this.jobService,
      this.logsRepo,
      authStrategies
    )
    this.shortLinksRouter = new ShortLinksRouter(this.logger)
    this.botsRouter = new BotsRouter({
      actionService,
      actionServersService,
      botService,
      cmsService,
      configProvider,
      flowService,
      mediaServiceProvider,
      logsService,
      notificationService,
      authService,
      workspaceService,
      moduleLoader,
      logger: this.logger
    })
    this.sdkApiRouter = new SdkApiRouter(this.logger)
    this.telemetryRouter = new TelemetryRouter(this.logger, this.authService, this.telemetryRepo)
    this.mediaRouter = new MediaRouter(
      this.logger,
      this.authService,
      this.workspaceService,
      mediaServiceProvider,
      this.configProvider
    )

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
    await AppLifecycle.waitFor(AppLifecycleEvents.CONFIGURATION_LOADED)
    await this.setupRootPath()

    const app = express()
    app.use(process.ROOT_PATH, this.app)
    this.httpServer = createServer(app)

    await this.mediaRouter.initialize()
    await this.botsRouter.initialize()
    this.cmsRouter = new CMSRouter(
      this.logger,
      this.authService,
      this.cmsService,
      this.workspaceService,
      this.ghostService
    )
    this.nluRouter = new NLURouter(this.logger, this.authService, this.workspaceService, this.nluService)
    this.converseRouter = new ConverseRouter(this.logger, this.converseService, this.authService, this)
    this.hintsRouter = new HintsRouter(this.logger, this.hintsService, this.authService, this.workspaceService)
    this.botsRouter.router.use('/content', this.cmsRouter.router)
    this.botsRouter.router.use('/converse', this.converseRouter.router)
    this.botsRouter.router.use('/nlu', this.nluRouter.router)

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    AppLifecycle.waitFor(AppLifecycleEvents.BOTPRESS_READY).then(() => {
      this.isBotpressReady = true
    })

    this.botsRouter.router.use('/hints', this.hintsRouter.router)
  }

  resolveAsset = file => path.resolve(process.PROJECT_LOCATION, 'data/assets', file)

  async start() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.httpServer
    await this.sdkApiRouter.initialize()

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

    this.app.get('/env.js', async (req, res) => {
      const branding = await this.configProvider.getBrandingConfig('admin')

      res.contentType('text/javascript')
      res.send(`
      (function(window) {
          window.USE_JWT_COOKIES = ${process.USE_JWT_COOKIES};
          window.APP_VERSION = "${process.BOTPRESS_VERSION}";
          window.APP_NAME = "${branding.title}";
          window.APP_FAVICON = "${branding.favicon}";
          window.APP_CUSTOM_CSS = "${branding.customCss}";
          window.TELEMETRY_URL = "${process.TELEMETRY_URL}";
          window.SEND_USAGE_STATS = "${botpressConfig!.sendUsageStats}";
        })(typeof window != 'undefined' ? window : {})
      `)
    })

    this.app.use('/assets', this.guardWhiteLabel(), express.static(this.resolveAsset('')))
    this.app.use(rewrite('/:app/:botId/*env.js', '/api/v1/bots/:botId/:app/js/env.js'))

    this.adminRouter.setupRoutes(this.app)

    this.app.use(`${BASE_API_PATH}/modules`, this.modulesRouter.router)
    this.app.use(`${BASE_API_PATH}/bots/:botId`, this.botsRouter.router)
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

    this.setupStaticRoutes(this.app)

    process.HOST = config.host
    process.PORT = await portFinder.getPortPromise({ port: config.port })
    process.EXTERNAL_URL = process.env.EXTERNAL_URL || config.externalUrl || `http://${process.HOST}:${process.PORT}`
    process.LOCAL_URL = `http://${process.HOST}:${process.PORT}${process.ROOT_PATH}`

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

  private guardWhiteLabel() {
    return (req, res, next) => {
      if (path.normalize(req.path) === '/custom-theme.css' && (!process.IS_PRO_ENABLED || !process.IS_LICENSED)) {
        return res.sendStatus(404)
      }
      next()
    }
  }

  setupStaticRoutes(app) {
    // Dynamically updates the static paths of index files
    const resolveIndexPaths = page => (req, res) => {
      res.contentType('text/html')

      // Not caching pages in dev (issue with webpack )
      if (this.indexCache[page] && process.IS_PRODUCTION) {
        return res.send(this.indexCache[page])
      }

      fs.readFile(this.resolveAsset(page), (err, data) => {
        if (data) {
          this.indexCache[page] = data
            .toString()
            .replace(/\<base href=\"\/\" ?\/\>/, `<base href="${process.ROOT_PATH}/" />`)
            .replace(/ROOT_PATH=""|ROOT_PATH = ''/, `window.ROOT_PATH="${process.ROOT_PATH}"`)

          res.send(this.indexCache[page])
        } else {
          res.sendStatus(404)
        }
      })
    }

    app.get('/studio', (req, res, next) => res.redirect('/admin'))

    app.use('/:app(studio)/:botId', express.static(this.resolveAsset('ui-studio/public'), { index: false }))
    app.use('/:app(studio)/:botId', resolveIndexPaths('ui-studio/public/index.html'))

    app.use('/:app(lite)/:botId?', express.static(this.resolveAsset('ui-studio/public/lite'), { index: false }))
    app.use('/:app(lite)/:botId?', resolveIndexPaths('ui-studio/public/lite/index.html'))

    app.use('/:app(lite)/:botId', express.static(this.resolveAsset('ui-studio/public'), { index: false }))
    app.use('/:app(lite)/:botId', resolveIndexPaths('ui-studio/public/index.html'))

    app.get(['/:app(studio)/:botId/*'], resolveIndexPaths('ui-studio/public/index.html'))

    app.use('/admin', express.static(this.resolveAsset('admin/ui/public'), { index: false }))
    app.get(['/admin', '/admin/*'], resolveIndexPaths('admin/ui/public/index.html'))

    app.get('/', (req, res) => res.redirect(`${process.ROOT_PATH}/admin`))
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
    const basePath = options && options.localUrl ? process.LOCAL_URL : process.EXTERNAL_URL
    const serverToken = generateUserToken({
      email: SERVER_USER,
      strategy: SERVER_USER_STRATEGY,
      tokenVersion: 1,
      isSuperAdmin: false,
      expiresIn: '5m',
      audience: TOKEN_AUDIENCE
    })

    return {
      baseURL: `${basePath}/api/v1/bots/${botId}`,
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

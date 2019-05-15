import bodyParser from 'body-parser'
import { AxiosBotConfig, AxiosOptions, http, Logger, RouterOptions } from 'botpress/sdk'
import LicensingService from 'common/licensing-service'
import session from 'cookie-session'
import cors from 'cors'
import errorHandler from 'errorhandler'
import { UnlicensedError } from 'errors'
import express from 'express'
import { Request } from 'express-serve-static-core'
import rewrite from 'express-urlrewrite'
import { createServer, Server } from 'http'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import ms from 'ms'
import path from 'path'
import portFinder from 'portfinder'

import { ExternalAuthConfig } from './config/botpress.config'
import { ConfigProvider } from './config/config-loader'
import { ModuleLoader } from './module-loader'
import { AdminRouter, AuthRouter, BotsRouter, ModulesRouter } from './routers'
import { ContentRouter } from './routers/bots/content'
import { ConverseRouter } from './routers/bots/converse'
import { isDisabled } from './routers/conditionalMiddleware'
import { InvalidExternalToken, PaymentRequiredError } from './routers/errors'
import { ShortLinksRouter } from './routers/shortlinks'
import { monitoringMiddleware } from './routers/util'
import { GhostService } from './services'
import ActionService from './services/action/action-service'
import { AlertingService } from './services/alerting-service'
import { AuthStrategies } from './services/auth-strategies'
import AuthService, { TOKEN_AUDIENCE } from './services/auth/auth-service'
import { generateUserToken } from './services/auth/util'
import { BotService } from './services/bot-service'
import { CMSService } from './services/cms'
import { ConverseService } from './services/converse'
import { FlowService } from './services/dialog/flow/service'
import { SkillService } from './services/dialog/skill/service'
import { LogsService } from './services/logs/service'
import MediaService from './services/media'
import { MonitoringService } from './services/monitoring'
import { NotificationsService } from './services/notification/service'
import { WorkspaceService } from './services/workspace-service'
import { TYPES } from './types'

const BASE_API_PATH = '/api/v1'
export const SERVER_USER = 'server::modules'
const isProd = process.env.NODE_ENV === 'production'

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
export default class HTTPServer {
  public readonly httpServer: Server
  public readonly app: express.Express

  private readonly authRouter: AuthRouter
  private readonly adminRouter: AdminRouter
  private readonly botsRouter: BotsRouter
  private contentRouter!: ContentRouter
  private readonly modulesRouter: ModulesRouter
  private readonly shortlinksRouter: ShortLinksRouter
  private converseRouter!: ConverseRouter

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Logger)
    @tagged('name', 'HTTP')
    private logger: Logger,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.FlowService) flowService: FlowService,
    @inject(TYPES.ActionService) actionService: ActionService,
    @inject(TYPES.ModuleLoader) moduleLoader: ModuleLoader,
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.MediaService) mediaService: MediaService,
    @inject(TYPES.LogsService) logsService: LogsService,
    @inject(TYPES.NotificationsService) notificationService: NotificationsService,
    @inject(TYPES.SkillService) skillService: SkillService,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.LicensingService) licenseService: LicensingService,
    @inject(TYPES.ConverseService) private converseService: ConverseService,
    @inject(TYPES.WorkspaceService) private workspaceService: WorkspaceService,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.AuthStrategies) private authStrategies: AuthStrategies,
    @inject(TYPES.MonitoringService) private monitoringService: MonitoringService,
    @inject(TYPES.AlertingService) private alertingService: AlertingService
  ) {
    this.app = express()

    if (!process.IS_PRODUCTION) {
      this.app.use(errorHandler())
    }

    if (process.core_env.REVERSE_PROXY) {
      this.app.set('trust proxy', process.core_env.REVERSE_PROXY)
    }

    this.httpServer = createServer(this.app)

    this.app.use(debugRequestMw)

    this.modulesRouter = new ModulesRouter(
      this.logger,
      this.authService,
      moduleLoader,
      skillService,
      this.configProvider
    )

    this.authRouter = new AuthRouter(
      this.logger,
      this.authService,
      this.configProvider,
      this.workspaceService,
      this.authStrategies
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
      this.alertingService
    )
    this.shortlinksRouter = new ShortLinksRouter(this.logger)
    this.botsRouter = new BotsRouter({
      actionService,
      botService,
      configProvider,
      flowService,
      mediaService,
      logsService,
      notificationService,
      authService,
      ghostService,
      workspaceService,
      logger: this.logger
    })
  }

  @postConstruct()
  async initialize() {
    await this.botsRouter.initialize()
    this.contentRouter = new ContentRouter(this.logger, this.authService, this.cmsService, this.workspaceService)
    this.converseRouter = new ConverseRouter(this.logger, this.converseService, this.authService, this)
    this.botsRouter.router.use('/content', this.contentRouter.router)
    this.botsRouter.router.use('/converse', this.converseRouter.router)
  }

  resolveAsset = file => path.resolve(process.PROJECT_LOCATION, 'assets', file)

  async start() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.httpServer

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

    this.app.use((req, res, next) => {
      if (!isDisabled('bodyParser', req)) {
        bodyParser.json({ limit: config.bodyLimit })(req, res, next)
      } else {
        next()
      }
    })

    // this.app.use(bodyParser.json({ limit: config.bodyLimit }))
    this.app.use(bodyParser.urlencoded({ extended: true }))

    if (config.cors && config.cors.enabled) {
      this.app.use(cors(config.cors.origin ? { origin: config.cors.origin } : {}))
    }

    this.app.get('/status', async (req, res, next) => {
      res.send(await this.monitoringService.getStatus())
    })

    this.app.use('/assets', this.guardWhiteLabel(), express.static(this.resolveAsset('')))
    this.app.use(rewrite('/:app/:botId/*env.js', '/api/v1/bots/:botId/:app/js/env.js'))

    this.app.use(`${BASE_API_PATH}/auth`, this.authRouter.router)
    this.app.use(`${BASE_API_PATH}/admin`, this.adminRouter.router)
    this.app.use(`${BASE_API_PATH}/modules`, this.modulesRouter.router)
    this.app.use(`${BASE_API_PATH}/bots/:botId`, this.botsRouter.router)
    this.app.use(`/s`, this.shortlinksRouter.router)

    this.app.use(function handleErrors(err, req, res, next) {
      if (err instanceof UnlicensedError) {
        next(new PaymentRequiredError(`Server is unlicensed "${err.message}"`))
      } else {
        next(err)
      }
    })

    this.app.use(function handleUnexpectedError(err, req, res, next) {
      const statusCode = err.statusCode || 500
      const errorCode = err.errorCode || 'BP_000'
      const message = (err.errorCode && err.message) || 'Unexpected error'
      const docs = err.docs || 'https://botpress.io/docs'
      const devOnly = isProd ? {} : { showStackInDev: true, stack: err.stack, full: err.message }

      res.status(statusCode).json({
        statusCode,
        errorCode,
        type: err.type || Object.getPrototypeOf(err).name || 'Exception',
        message,
        docs,
        ...devOnly
      })
    })

    this.setupStaticRoutes(this.app)

    process.HOST = config.host
    process.PORT = await portFinder.getPortPromise({ port: config.port })
    process.EXTERNAL_URL = process.env.EXTERNAL_URL || config.externalUrl || `http://${process.HOST}:${process.PORT}`
    process.LOCAL_URL = `http://${process.HOST}:${process.PORT}`

    if (process.PORT !== config.port) {
      this.logger.warn(`Configured port ${config.port} is already in use. Using next port available: ${process.PORT}`)
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
    app.get('/studio', (req, res, next) => res.redirect('/admin'))

    app.use('/:app(studio)/:botId', express.static(this.resolveAsset('ui-studio/public')))
    app.use('/:app(lite)/:botId?', express.static(this.resolveAsset('ui-studio/public/lite')))
    app.use('/:app(lite)/:botId', express.static(this.resolveAsset('ui-studio/public')))

    app.get(['/:app(studio)/:botId/*'], (req, res) => {
      res.contentType('text/html')
      res.sendFile(this.resolveAsset('ui-studio/public/index.html'))
    })

    app.use('/admin', express.static(this.resolveAsset('ui-admin/public')))

    app.get(['/admin', '/admin/*'], (req, res) => {
      res.contentType('text/html')
      res.sendFile(this.resolveAsset('ui-admin/public/index.html'))
    })

    app.get('/api/community/hero', (req, res) => res.send({ hidden: true }))
    app.get('/', (req, res) => res.redirect('/admin'))
  }

  createRouterForBot(router: string, identity: string, options: RouterOptions): any & http.RouterExtension {
    return this.botsRouter.getNewRouter(router, identity, options)
  }

  deleteRouterForBot(router: string): void {
    return this.botsRouter.deleteRouter(router, this.app)
  }

  createShortLink(name: string, destination: string, params: any) {
    this.shortlinksRouter.createShortLink(name, destination, params)
  }

  deleteShortLink(name: string) {
    this.shortlinksRouter.deleteShortLink(name)
  }

  async getAxiosConfigForBot(botId: string, options?: AxiosOptions): Promise<AxiosBotConfig> {
    const basePath = options && options.localUrl ? process.LOCAL_URL : process.EXTERNAL_URL
    const serverToken = generateUserToken(SERVER_USER, false, '5m', TOKEN_AUDIENCE)
    return {
      baseURL: `${basePath}/api/v1/bots/${botId}`,
      headers: {
        Authorization: `Bearer ${serverToken}`
      }
    }
  }

  extractExternalToken = async (req, res, next) => {
    if (req.headers['x-bp-externalauth']) {
      try {
        req.credentials = await this.decodeExternalToken(req.headers['x-bp-externalauth'])
      } catch (error) {
        return next(new InvalidExternalToken(error.message))
      }
    }

    next()
  }

  async decodeExternalToken(externalToken): Promise<any | undefined> {
    const externalAuth = await this._getExternalAuthConfig()

    if (!externalAuth || !externalAuth.enabled) {
      return undefined
    }

    const { publicKey, audience, algorithms, issuer } = externalAuth

    const [scheme, token] = externalToken.split(' ')
    if (scheme.toLowerCase() !== 'bearer') {
      return new Error(`Unknown scheme "${scheme}"`)
    }

    return Promise.fromCallback(cb => {
      jsonwebtoken.verify(token, publicKey, { issuer, audience, algorithms }, (err, user) => {
        cb(err, !err ? user : undefined)
      })
    })
  }

  @Memoize
  private async _getExternalAuthConfig(): Promise<ExternalAuthConfig | undefined> {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.pro.externalAuth

    if (!config) {
      return
    }

    if (config.enabled) {
      if (!config.publicKey) {
        try {
          config.publicKey = await this.ghostService.global().readFileAsString('/', 'end_users_auth.pub')
        } catch (error) {
          this.logger
            .attachError(error)
            .error(`External User Auth: Couldn't open public key file /data/global/end_users_auth.pub`)
          return undefined
        }
      } else if (config.publicKey.length < 256) {
        this.logger.error(`External User Auth: The provided publicKey is invalid (too short)`)
        return undefined
      }
    }

    return config
  }
}

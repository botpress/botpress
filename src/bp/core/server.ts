import bodyParser from 'body-parser'
import { AxiosBotConfig, AxiosOptions, Logger, RouterOptions } from 'botpress/sdk'
import LicensingService from 'common/licensing-service'
import cors from 'cors'
import errorHandler from 'errorhandler'
import { UnlicensedError } from 'errors'
import express from 'express'
import rewrite from 'express-urlrewrite'
import { createServer, Server } from 'http'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import path from 'path'
import portFinder from 'portfinder'

import { ConfigProvider } from './config/config-loader'
import { ModuleLoader } from './module-loader'
import { BotRepository } from './repositories'
import { AdminRouter, AuthRouter, BotsRouter, ModulesRouter } from './routers'
import { ContentRouter } from './routers/bots/content'
import { ConverseRouter } from './routers/bots/converse'
import { PaymentRequiredError } from './routers/errors'
import { ShortLinksRouter } from './routers/shortlinks'
import { GhostService } from './services'
import ActionService from './services/action/action-service'
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
import { NotificationsService } from './services/notification/service'
import { WorkspaceService } from './services/workspace-service'
import { TYPES } from './types'

const BASE_API_PATH = '/api/v1'
const SERVER_USER = 'server::modules'
const isProd = process.env.NODE_ENV === 'production'

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
    @inject(TYPES.BotRepository) botRepository: BotRepository,
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
    @inject(TYPES.AuthStrategies) private authStrategies: AuthStrategies
  ) {
    this.app = express()

    if (!process.IS_PRODUCTION) {
      this.app.use(errorHandler())
    }

    this.httpServer = createServer(this.app)

    this.modulesRouter = new ModulesRouter(this.logger, moduleLoader, skillService)
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
      this.configProvider
    )
    this.shortlinksRouter = new ShortLinksRouter(this.logger)
    this.botsRouter = new BotsRouter({
      actionService,
      botRepository,
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
    this.converseRouter = new ConverseRouter(this.logger, this.converseService, this.authService)
    this.botsRouter.router.use('/content', this.contentRouter.router)
    this.botsRouter.router.use('/converse', this.converseRouter.router)
  }

  resolveAsset = file => path.resolve(process.PROJECT_LOCATION, 'assets', file)

  async start() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.httpServer

    // TODO FIXME Conditionally enable this
    this.app.use(bodyParser.json({ limit: config.bodyLimit }))
    this.app.use(bodyParser.urlencoded({ extended: true }))

    if (config.cors && config.cors.enabled) {
      this.app.use(cors(config.cors.origin ? { origin: config.cors.origin } : {}))
    }

    this.app.use('/assets', express.static(this.resolveAsset('')))
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

  createRouterForBot(router: string, options: RouterOptions) {
    return this.botsRouter.getNewRouter(router, options)
  }

  createShortLink(name: string, destination: string, params: any) {
    this.shortlinksRouter.createShortLink(name, destination, params)
  }

  deleteShortLink(name: string) {
    this.shortlinksRouter.deleteShortLink(name)
  }

  async getAxiosConfigForBot(botId: string, options?: AxiosOptions): Promise<AxiosBotConfig> {
    const basePath = options && options.localUrl ? process.LOCAL_URL : process.EXTERNAL_URL
    const serverToken = generateUserToken(SERVER_USER, false, TOKEN_AUDIENCE)
    return {
      baseURL: `${basePath}/api/v1/bots/${botId}`,
      headers: {
        Authorization: `Bearer ${serverToken}`
      }
    }
  }
}

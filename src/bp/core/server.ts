import bodyParser from 'body-parser'
import { AxiosBotConfig, Logger, RouterOptions } from 'botpress/sdk'
import LicensingService from 'common/licensing-service'
import errorHandler from 'errorhandler'
import express from 'express'
import { createServer, Server } from 'http'
import { inject, injectable, tagged } from 'inversify'
import portFinder from 'portfinder'

import { ConfigProvider } from './config/config-loader'
import { ModuleLoader } from './module-loader'
import { BotRepository } from './repositories'
import { AdminRouter, AuthRouter, BotsRouter, ModulesRouter } from './routers'
import { ShortLinksRouter } from './routers/shortlinks'
import { GhostService } from './services'
import ActionService from './services/action/action-service'
import { AdminService } from './services/admin/service'
import AuthService from './services/auth/auth-service'
import { CMSService } from './services/cms/cms-service'
import { FlowService } from './services/dialog/flow/service'
import { SkillService } from './services/dialog/skill/service'
import { LogsService } from './services/logs/service'
import MediaService from './services/media'
import { NotificationsService } from './services/notification/service'
import { TYPES } from './types'

const BASE_API_PATH = '/api/v1'

const isProd = process.env.NODE_ENV === 'production'

@injectable()
export default class HTTPServer {
  public readonly httpServer: Server
  public readonly app: express.Express

  private readonly authRouter: AuthRouter
  private readonly adminRouter: AdminRouter
  private readonly modulesRouter: ModulesRouter
  private readonly botsRouter: BotsRouter
  private readonly shortlinksRouter: ShortLinksRouter

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Logger)
    @tagged('name', 'HTTP')
    private logger: Logger,
    @inject(TYPES.IsProduction) isProduction: boolean,
    @inject(TYPES.BotRepository) botRepository: BotRepository,
    @inject(TYPES.CMSService) cmsService: CMSService,
    @inject(TYPES.FlowService) flowService: FlowService,
    @inject(TYPES.ActionService) actionService: ActionService,
    @inject(TYPES.ModuleLoader) moduleLoader: ModuleLoader,
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.AdminService) private adminService: AdminService,
    @inject(TYPES.MediaService) mediaService: MediaService,
    @inject(TYPES.LogsService) logsService: LogsService,
    @inject(TYPES.NotificationsService) notificationService: NotificationsService,
    @inject(TYPES.SkillService) skillService: SkillService,
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.LicensingService) licenseService: LicensingService
  ) {
    this.app = express()

    if (!isProduction) {
      this.app.use(errorHandler())
    }

    this.httpServer = createServer(this.app)

    this.modulesRouter = new ModulesRouter(moduleLoader, skillService)
    this.authRouter = new AuthRouter(this.logger, this.authService, this.adminService)
    this.adminRouter = new AdminRouter(this.logger, this.authService, this.adminService, licenseService)
    this.shortlinksRouter = new ShortLinksRouter()
    this.botsRouter = new BotsRouter({
      actionService,
      botRepository,
      cmsService,
      flowService,
      mediaService,
      logsService,
      notificationService,
      authService,
      adminService,
      ghostService
    })
  }

  async start() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.httpServer

    this.app.use(
      // TODO FIXME Conditionally enable this
      bodyParser.json({
        limit: config.bodyLimit
      })
    )

    this.app.use(
      bodyParser.urlencoded({
        extended: true
      })
    )

    this.app.use(`${BASE_API_PATH}/auth`, this.authRouter.router)
    this.app.use(`${BASE_API_PATH}/admin`, this.adminRouter.router)
    this.app.use(`${BASE_API_PATH}/modules`, this.modulesRouter.router)
    this.app.use(`${BASE_API_PATH}/bots/:botId`, this.botsRouter.router)
    this.app.use(`${BASE_API_PATH}/s`, this.shortlinksRouter.router)

    this.app.use((err, req, res, next) => {
      const statusCode = err.status || 500
      const code = err.code || 'BP_000'
      const message = (err.code && err.message) || 'Unexpected error'
      const devOnly = isProd
        ? {}
        : {
            stack: err.stack,
            full: err.message
          }

      res.status(statusCode).json({
        status: 'error',
        code,
        type: err.type || Object.getPrototypeOf(err).name || 'Exception',
        message,
        docs: err.docs || undefined,
        ...devOnly
      })
    })

    process.PORT = await portFinder.getPortPromise({ port: config.port })
    if (process.PORT !== config.port) {
      this.logger.warn(`Configured port ${config.port} is already in use. Using next port available: ${process.PORT}`)
      config.port = process.PORT
      // If both ports are in use, the delay is too short between checks and it reports a false opened port
      // TODO: Remove when the proxy is removed
      await Promise.delay(200)
    }

    await Promise.fromCallback(callback => {
      this.httpServer.listen(config, callback)
    })

    this.logger.info(`API listening on http://${config.host || 'localhost'}:${process.PORT}`)

    return this.app
  }

  createRouterForBot(router: string, options: RouterOptions) {
    return this.botsRouter.getNewRouter(router, options)
  }

  createShortLink(name: string, destination: string, params: any) {
    this.shortlinksRouter.createShortLink(name, destination, params)
  }

  async getAxiosConfigForBot(botId: string): Promise<AxiosBotConfig> {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.httpServer

    return {
      baseURL: `http://${config.host || 'localhost'}:${process.PROXY_PORT}`,
      headers: {
        'X-Botpress-Bot-Id': botId,
        'X-Botpress-App': 'Studio'
      }
    }
  }
}

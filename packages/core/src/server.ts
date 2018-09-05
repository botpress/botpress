import bodyParser from 'body-parser'
import { Logger, RouterOptions } from 'botpress-module-sdk'
import errorHandler from 'errorhandler'
import express from 'express'
import { createServer, Server } from 'http'
import { inject, injectable, tagged } from 'inversify'

import { ConfigProvider } from './config/config-loader'
import { TYPES } from './misc/types'
import { BotRepository } from './repositories/bot-repository'

import { AdminRouter, BotsRouter, ModulesRouter } from './routers'

import { ModuleLoader } from './module-loader'
import ActionService from './services/action/action-service'
import AuthService from './services/auth/auth-service'
import TeamsService from './services/auth/teams-service'
import { CMSService } from './services/cms/cms-service'
import FlowService from './services/dialog/flow/service'

const BASE_API_PATH = '/api/v1'

const isProd = process.env.NODE_ENV === 'production'

@injectable()
export default class HTTPServer {
  public readonly httpServer: Server
  public readonly app: express.Express

  private readonly botsRouter: BotsRouter
  private readonly modulesRouter: ModulesRouter
  private readonly adminRouter: AdminRouter

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
    @inject(TYPES.TeamsService) private teamsService: TeamsService
  ) {
    this.app = express()

    if (!isProduction) {
      this.app.use(errorHandler())
    }

    this.httpServer = createServer(this.app)

    this.botsRouter = new BotsRouter({ actionService, botRepository, cmsService, flowService })
    this.modulesRouter = new ModulesRouter(moduleLoader)
    this.adminRouter = new AdminRouter(this.logger, this.authService, this.teamsService)
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

    this.app.use(`${BASE_API_PATH}/modules`, this.modulesRouter.router)
    this.app.use(`${BASE_API_PATH}/bots/:botId`, this.botsRouter.router)

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

    await Promise.fromCallback(callback => {
      this.httpServer.listen(config, callback)
    })

    this.logger.info(`API listening on http://${config.host || 'localhost'}:${config.port}`)

    return this.app
  }

  createRouterForBot(router: string, options: RouterOptions) {
    return this.botsRouter.getNewRouter(router, options)
  }
}

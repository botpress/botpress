import bodyParser from 'body-parser'
import { Logger, RouterOptions } from 'botpress-module-sdk'
import errorHandler from 'errorhandler'
import express from 'express'
import { createServer, Server } from 'http'
import { inject, injectable, tagged } from 'inversify'

import { ConfigProvider } from './config/config-loader'
import { TYPES } from './misc/types'
import { BotRepository } from './repositories/bot-repository'

import { BotsRouter, ModulesRouter } from './routers'

import { ModuleLoader } from './module-loader'
import ActionService from './services/action/action-service'
import { CMSService } from './services/cms/cms-service'
import FlowService from './services/dialog/flow-service'

const BASE_API_PATH = '/api/v1'

@injectable()
export default class HTTPServer {
  readonly httpServer: Server
  readonly app: express.Express
  private readonly botsRouter: BotsRouter

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
    @inject(TYPES.ModuleLoader) moduleLoader: ModuleLoader
  ) {
    this.app = express()

    this.botsRouter = new BotsRouter({ actionService, botRepository, cmsService, flowService })
    const modulesRouter = new ModulesRouter(moduleLoader)

    this.app.use(bodyParser.json()) // TODO FIXME Conditionally enable this
    this.app.use(`${BASE_API_PATH}/modules`, modulesRouter.router)
    this.app.use(`${BASE_API_PATH}/bots/:botId`, this.botsRouter.router)

    if (!isProduction) {
      this.app.use(errorHandler())
    }

    this.httpServer = createServer(this.app)
  }

  async start() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.httpServer

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

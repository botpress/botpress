import bodyParser from 'body-parser'
import errorHandler from 'errorhandler'
import express from 'express'
import { Server } from 'http'
import { inject, injectable, tagged } from 'inversify'

import { ConfigProvider } from './config/config-loader'
import { Logger } from './misc/interfaces'
import { TYPES } from './misc/types'
import { BotRepository } from './repositories/bot-repository'
import { BotRouter } from './router/bot-router'
import { IndexRouter } from './router/index-router'
import ActionService from './services/action/action-service'
import { CMSService } from './services/cms/cms-service'
import FlowService from './services/dialog/flow-service'
import { MiddlewareService } from './services/middleware/middleware-service'

const BASE_API_PATH = '/api/v1'

@injectable()
export default class HTTPServer {
  server: Server | undefined
  app: express.Express

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Logger)
    @tagged('name', 'HTTP')
    private logger: Logger,
    @inject(TYPES.BotRepository) private botRepository: BotRepository,
    @inject(TYPES.MiddlewareService) private middlewareService: MiddlewareService,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.ActionService) private actionService: ActionService
  ) {
    this.app = express()

    if (process.env.NODE_ENV === 'development') {
      this.app.use(errorHandler())
    } else {
      this.app.use((err, req, res, next) => {
        const statusCode = err.status || 500
        const code = err.code || 'BP_000'
        const message = (err.code && err.message) || 'Unexpected error'

        res.status(statusCode).json({
          status: 'error',
          code,
          type: err.type || Object.getPrototypeOf(err).name || 'Exception',
          message,
          docs: err.docs || undefined
        })
      })
    }
  }

  async start() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.httpServer

    const routers = [
      new IndexRouter(),
      new BotRouter({
        actionService: this.actionService,
        botRepository: this.botRepository,
        cmsService: this.cmsService,
        flowService: this.flowService,
        middlewareService: this.middlewareService
      })
    ]

    this.app.use(
      bodyParser.json({
        limit: config.bodyLimit
      })
    )
    this.app.use(
      bodyParser.urlencoded({
        extended: true
      })
    )
    this.app.use(BASE_API_PATH, routers.map(r => r.router))

    await Promise.fromCallback(callback => {
      this.server = this.app.listen(config, callback)
    })

    this.logger.info(`API listening on http://${config.host || 'localhost'}:${config.port}`)

    return this.app
  }
}

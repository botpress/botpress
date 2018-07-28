import 'bluebird-global'
import errorHandler from 'errorhandler'
import express from 'express'
import { Server } from 'http'
import { inject, injectable } from 'inversify'

import { ConfigProvider } from './config/config-loader'
import { Logger } from './misc/interfaces'
import { TYPES } from './misc/types'
import { BotRepository } from './repositories/bot-repository'
import { IndexRouter } from './router'
import { BotRouter } from './router/bots'

const BASE_API_PATH = '/api/v1'

@injectable()
export default class HTTPServer {
  server: Server
  app: express.Express

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.BotRepository) private botRepository: BotRepository,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {
    const indexRouter = new IndexRouter()
    const botRouter = new BotRouter(botRepository)

    this.app = express()
    this.app.use(BASE_API_PATH, indexRouter.router, botRouter.router)

    if (process.env.NODE_ENV === 'development') {
      this.app.use(errorHandler())
    }
  }

  async start() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.httpServer

    await Promise.fromCallback(callback => {
      this.server = this.app.listen(config, callback)
    })

    this.logger.info(`App is running at ${config.host || 'localhost'}:${config.port}`)

    return this.app
  }
}

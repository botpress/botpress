import bodyParser from 'body-parser'
import express from 'express'
import { inject, injectable, tagged } from 'inversify'

import { ConfigProvider } from './config/config-loader'
import { Logger } from './misc/interfaces'
import { TYPES } from './misc/types'

import Router from './router'

const BASE_API_PATH = '/api/v1'

const isProd = process.env.NODE_ENV === 'production'

@injectable()
export default class HTTPServer {
  app: express.Express

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Logger)
    @tagged('name', 'HTTP')
    private logger: Logger,
    @inject(TYPES.Router) private apiRouter: Router
  ) {
    this.app = express()
  }

  async start() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.httpServer

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

    this.app.use(BASE_API_PATH, this.apiRouter.router)

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
      this.app.listen(config, callback)
    })

    this.logger.info(`API listening on http://${config.host || 'localhost'}:${config.port}`)

    return this.app
  }
}

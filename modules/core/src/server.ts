import 'bluebird-global'
import errorHandler from 'errorhandler'
import express from 'express'
import { Server } from 'http'
import { inject, injectable } from 'inversify'

import { TYPES } from './misc/types'
import { BotRepository } from './repositories/bot-repository'
import { IndexRouter } from './router'
import { BotRouter } from './router/bots'

const BASE_API_PATH = '/api/v1'

@injectable()
export default class HTTPServer {
  server: Server
  app: express.Express

  constructor(@inject(TYPES.BotRepository) private botRepository: BotRepository) {
    const indexRouter = new IndexRouter()
    const botRouter = new BotRouter(botRepository)

    this.app = express()
    this.app.use(BASE_API_PATH, indexRouter.router, botRouter.router)

    if (process.env.NODE_ENV === 'development') {
      this.app.use(errorHandler())
    }
  }

  async start() {
    await Promise.fromCallback(callback => {
      this.server = this.app.listen(process.env.HOST_PORT, callback)
    })

    console.log(
      '** App is running at %s:%d in %s mode',
      process.env.HOST_URL,
      process.env.HOST_PORT,
      process.env.ENVIRONMENT
    )

    return this.app
  }
}

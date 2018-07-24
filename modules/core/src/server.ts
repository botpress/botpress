import 'bluebird-global'

import express from 'express'
import errorHandler from 'errorhandler'
import { Server } from 'http'

import * as indexRouter from './router/index'
import { injectable } from 'inversify'

const BASE_API_PATH = '/api/v1'

@injectable()
export default class HTTPServer {
  server: Server
  app: express.Express

  constructor() {
    this.app = express()
    this.app.use(BASE_API_PATH, indexRouter.default)

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

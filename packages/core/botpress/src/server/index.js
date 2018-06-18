import express from 'express'
import compression from 'compression'
import http from 'http'

import Socket from './socket'
import Static from './static'
import Api from './api'

module.exports = bp => {
  const serveApi = async app => {
    const api = Api(bp)
    return api.install(app)
  }

  const serveSocket = async server => {
    const socket = Socket(bp)
    return socket.install(server)
  }

  const serveStatic = async app => {
    const staticStuff = Static(bp)
    return staticStuff.install(app)
  }

  const start = async () => {
    const app = express()
    app.use(compression())
    const server = http.createServer(app)
    const { port, hostname } = bp.botfile

    await serveApi(app)
    await serveSocket(server)
    await serveStatic(app)

    return new Promise(resolve => {
      server.listen(port, hostname, () => resolve(server))
    })
  }

  return { start }
}

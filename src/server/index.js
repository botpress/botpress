import express from 'express'
import http from 'http'

import Socket from './socket'
import Static from './static'
import Api from './api'

module.exports = bp => {
  async function serveApi(app) {
    const api = Api(bp)
    return api.install(app)
  }

  async function serveSocket(server) {
    const socket = Socket(bp)
    return socket.install(server)
  }

  async function serveStatic(app) {
    const staticStuff = Static(bp)
    return staticStuff.install(app)
  }

  async function start() {
    const app = express()
    const server = http.createServer(app)
    const port = bp.botfile.port

    await serveApi(app)
    await serveSocket(server)
    await serveStatic(app)

    return new Promise(resolve => {
      server.listen(port, () => resolve())
    })
  }

  return { start }
}

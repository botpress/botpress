import { BotpressConfig } from 'core/config/botpress.config'
import express from 'express'
import { Request } from 'express-serve-static-core'
import { createServer } from 'http'
import IORedis from 'ioredis'
import _ from 'lodash'
import portFinder from 'portfinder'

import { print } from '.'
import { printHeader, wrapMethodCall } from './utils'

export const startMonitor = async (config: BotpressConfig, redisClient: IORedis.Redis) => {
  printHeader('Realtime Test')

  if (redisClient) {
    await wrapMethodCall('Start Redis Monitor', () => {
      redisClient.monitor((err, monitor) => {
        monitor.on('monitor', (_time, args, source, database) => {
          print(`[Redis] ${args} - ${source} ${database}`)
        })

        if (err) {
          print(`Redis monitor error: ${err}`)
        }
      })
    })
  }

  if (config) {
    await startServer(config)
  }

  print('')
}

const infoMw = (req: Request, res) => {
  const { method, ip, originalUrl } = req
  print(`[HTTP] ${method} ${ip} ${originalUrl}`)

  const summary = `Method: ${method}\nIP: ${ip}\nURL: ${originalUrl}\n\n`
  const headers = `Headers:\n${JSON.stringify(req.headers, undefined, 2)}`

  res.send(`<pre>Received:\n${summary} ${headers}</pre>`)
}

export const startServer = async (config: BotpressConfig) => {
  const port = await portFinder.getPortPromise({ port: config.httpServer.port })

  await wrapMethodCall(`Start HTTP Server (port ${port})`, async () => {
    const app = express()
    app.use(infoMw)

    const httpServer = createServer(app)
    const hostname = config.httpServer.host === 'localhost' ? undefined : config.httpServer.host

    await Promise.fromCallback(callback => {
      httpServer.listen(port, hostname, config.httpServer.backlog, callback)
    })
  })
}

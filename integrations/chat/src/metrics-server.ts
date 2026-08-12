import * as http from 'http'
import { collectDefaultMetrics } from 'prom-client'
import { bareLogger } from './logger'
import { registry } from './metrics'

export const startMetricsServer = (port: number) => {
  collectDefaultMetrics({ register: registry })
  const server = http.createServer((req, res) => {
    void (async () => {
      try {
        if (req.url === '/health') {
          res.writeHead(200).end('ok')
          return
        }

        if (req.url === '/metrics') {
          const metrics = await registry.metrics()
          res.writeHead(200, { 'Content-Type': registry.contentType })
          res.end(metrics)
          return
        }

        res.writeHead(404).end('Not Found')
      } catch (err) {
        bareLogger.error('Metrics server error:', err)
        if (!res.headersSent) {
          res.writeHead(500).end('Internal Server Error')
        }
      }
    })()
  })

  server.on('error', (err) => {
    bareLogger.error(`Metrics server failed to start: ${err.message}`)
  })

  server.listen(port, () => {
    bareLogger.info(`Metrics server listening on port ${port}`)
  })
}

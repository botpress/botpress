import * as http from 'http'
import { registry } from './metrics'

export const startMetricsServer = (port: number) => {
  const server = http.createServer((req, res) => {
    void (async () => {
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
    })()
  })

  server.on('error', (err) => {
    console.error(`Metrics server failed to start: ${err.message}`)
  })

  server.listen(port, () => {})
}

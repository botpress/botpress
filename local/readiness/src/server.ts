import { Logger } from '@bpinternal/log4bot'
import express from 'express'

export async function startServer(logger: Logger, handler: express.Handler) {
  const app = express()
  const port = process.env.PORT ? parseInt(process.env.PORT) : 9398

  logger.info(`Starting docker compose server on port ${port}`)

  app.get('/ready', handler)

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(port)
    server.once('error', reject)
    server.once('listening', resolve)
    server.setTimeout(5000)

    if (import.meta.hot) {
      import.meta.hot.on('vite:beforeFullReload', () => {
        server.close()
      })
    }
  })
}

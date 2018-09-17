import { Application, Router } from 'express'
import proxy from 'express-http-proxy'

export const BASE_PATH = '/api/v1'
const BOT_REQUEST_HEADERS = 'x-api-bot-id'

export class HttpProxy {
  constructor(private app: Application | Router, private targetHost: string) {}

  proxy(originPath: string, targetPathOrOptions: string | {}) {
    const options =
      typeof targetPathOrOptions === 'string'
        ? {
            proxyReqPathResolver: req => setApiBasePath(req) + targetPathOrOptions
          }
        : targetPathOrOptions
    this.app.use(originPath, proxy(this.targetHost, options))

    return this
  }
}

export function setApiBasePath(req) {
  // TODO: Get actual headers once the UI has been modified
  const botId = req.get(BOT_REQUEST_HEADERS) || 'bot123'
  return `${BASE_PATH}/bots/${botId}`
}

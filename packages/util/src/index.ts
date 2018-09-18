import { Application, Router } from 'express'
import proxy from 'express-http-proxy'

export const BASE_PATH = '/api/v1'
const BOT_REQUEST_HEADERS = 'X-API-Bot-Id'

export class HttpProxy {
  constructor(private app: Application | Router, private targetHost: string) {}

  proxy(originPath: string, targetPathOrOptions: string | {}) {
    const options =
      typeof targetPathOrOptions === 'string'
        ? {
            proxyReqPathResolver: req => getApiBasePath(req) + targetPathOrOptions
          }
        : targetPathOrOptions
    this.app.use(originPath, proxy(this.targetHost, options))

    return this
  }
}

export function getApiBasePath(req) {
  const botId = req.get(BOT_REQUEST_HEADERS)
  return `${BASE_PATH}/bots/${botId}`
}

import { Application, Router } from 'express'
import proxy from 'express-http-proxy'

export const BASE_PATH = '/api/v1'
const BOT_REQUEST_HEADERS = 'X-API-Bot-Id'

export function getApiBasePath(req) {
  // FIXME: Remove the hardcoded botId once the headers in the UI will be added.
  const botId = req.get(BOT_REQUEST_HEADERS) || 'bot123'
  return `${BASE_PATH}/bots/${botId}`
}

export function noCache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  res.header('Expires', '-1')
  res.header('Pragma', 'no-cache')
  delete req.headers['if-modified-since']
  delete req.headers['if-none-match']
  next()
}

export class HttpProxy {
  constructor(private app: Application | Router, private targetHost: string) {}

  proxy(originPath: string, targetPathOrOptions: string | {}) {
    if (!this.targetHost) {
      throw new Error('The proxy target host is empty!')
    }

    const options =
      typeof targetPathOrOptions === 'string'
        ? {
            proxyReqPathResolver: req => getApiBasePath(req) + targetPathOrOptions
          }
        : targetPathOrOptions
    this.app.use(originPath, noCache, proxy(this.targetHost, options))

    return this
  }
}

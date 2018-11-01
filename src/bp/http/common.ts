import { Application, Router } from 'express'
import proxy from 'express-http-proxy'
import _ from 'lodash'

export const BASE_PATH = '/api/v1'
const BOT_REQUEST_HEADERS = 'X-Botpress-Bot-Id'

export function extractBotId(req) {
  const regex = /\/(studio|lite)\/(.+?)\//i
  const fromReferer = _.get((req.get('Referer') || '').match(regex), '2')
  return req.get(BOT_REQUEST_HEADERS) || fromReferer
}

export function getApiBasePath(req) {
  const botId = extractBotId(req)
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

  proxyForBot(originPath: string, targetPathOrOptions: string | {}) {
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

  proxyAdmin(originPath: string, targetPathOrOptions: string | {}) {
    if (!this.targetHost) {
      throw new Error('The proxy target host is empty!')
    }

    const options =
      typeof targetPathOrOptions === 'string'
        ? {
            proxyReqPathResolver: () => `${BASE_PATH}/admin${targetPathOrOptions}`
          }
        : targetPathOrOptions
    this.app.use(originPath, noCache, proxy(this.targetHost, options))

    return this
  }
}

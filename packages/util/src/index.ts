import { Application, Router } from 'express'
import proxy from 'express-http-proxy'

export class HttpProxy {
  constructor(private app: Application | Router, private targetHost: string) {}

  proxy(originPath: string, targetPathOrOptions: string | {}) {
    const options =
      typeof targetPathOrOptions === 'string'
        ? {
            proxyReqPathResolver: () => targetPathOrOptions
          }
        : targetPathOrOptions
    this.app.use(originPath, proxy(this.targetHost, options))

    return this
  }
}

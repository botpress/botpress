import { Application } from 'express'
import proxy from 'express-http-proxy'

export class HttpProxy {
  constructor(private app: Application, private targetHost: string) {}

  proxy(originPath: string, targetPath: string) {
    this.app.use(
      originPath,
      proxy(this.targetHost, {
        proxyReqPathResolver: () => targetPath
      })
    )

    return this
  }
}

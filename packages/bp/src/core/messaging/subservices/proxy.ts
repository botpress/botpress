import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

export class MessagingProxy {
  async setup(app: express.Express, baseApiPath: string) {
    app.use(
      `${baseApiPath}/messaging`,
      createProxyMiddleware({
        pathRewrite: path => {
          return path.replace(`${baseApiPath}/messaging`, '')
        },
        router: () => {
          return this.getMessagingUrl()
        },
        changeOrigin: false,
        logLevel: 'silent'
      })
    )
  }

  private getMessagingUrl() {
    return process.core_env.MESSAGING_ENDPOINT
      ? process.core_env.MESSAGING_ENDPOINT
      : `http://localhost:${process.MESSAGING_PORT}`
  }
}

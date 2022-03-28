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
          return `http://localhost:${process.MESSAGING_PORT}`
        },
        changeOrigin: false,
        logLevel: 'silent'
      })
    )
  }
}

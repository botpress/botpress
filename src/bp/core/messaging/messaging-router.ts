import * as sdk from 'botpress/sdk'
import { HTTPServer } from 'core/app/server'
import { CustomRouter } from 'core/routers/customRouter'
import { Router } from 'express'
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware'
import { MessagingService } from './messaging-service'

export class MessagingRouter extends CustomRouter {
  constructor(private logger: sdk.Logger, private messaging: MessagingService, private http: HTTPServer) {
    super('Messaging', logger, Router({ mergeParams: true }))
  }

  public setupRoutes(): void {
    this.router.post('/receive', async (req, res) => {
      const msg = req.body

      await this.messaging.receive(
        msg.client.id,
        msg.channel.name,
        msg.user.id,
        msg.conversation.id,
        msg.message.payload
      )

      res.sendStatus(200)
    })

    this.router.use(
      '/',
      createProxyMiddleware({
        pathRewrite: (path, req) => {
          return path.replace('/api/v1/messaging', '')
        },
        router: () => {
          return `http://localhost:${process.MESSAGING_PORT}`
        },
        changeOrigin: false,
        logLevel: 'silent',
        // Fix post requests when the middleware is added after the body parser mw
        onProxyReq: fixRequestBody
      })
    )
  }
}

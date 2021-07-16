import * as sdk from 'botpress/sdk'
import { UnauthorizedError } from 'common/http'
import { HTTPServer } from 'core/app/server'
import { CustomRouter } from 'core/routers/customRouter'
import { Router } from 'express'
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware'
import { MessagingLegacy } from './legacy'
import { MessagingService } from './messaging-service'

export class MessagingRouter extends CustomRouter {
  private legacy: MessagingLegacy

  constructor(private logger: sdk.Logger, private messaging: MessagingService, private http: HTTPServer) {
    super('Messaging', logger, Router({ mergeParams: true }))
    this.legacy = new MessagingLegacy(logger, http)
  }

  public setupRoutes(): void {
    this.router.post('/receive', async (req, res, next) => {
      if (req.headers.password !== process.INTERNAL_PASSWORD) {
        return next(new UnauthorizedError('Password is missing or invalid'))
      }

      const msg = req.body

      await this.messaging.receive({
        clientId: msg.client.id,
        channel: msg.channel.name,
        userId: msg.user.id,
        conversationId: msg.conversation.id,
        messageId: msg.message.id,
        payload: msg.message.payload
      })

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

    this.legacy.setup()
  }
}

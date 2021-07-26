import * as sdk from 'botpress/sdk'
import { UnauthorizedError } from 'common/http'
import { HTTPServer } from 'core/app/server'
import { CustomRouter } from 'core/routers/customRouter'
import { Router } from 'express'
import { MessagingLegacy } from './legacy'
import { MessagingService } from './messaging-service'

export class MessagingRouter extends CustomRouter {
  private legacy: MessagingLegacy

  constructor(private logger: sdk.Logger, private messaging: MessagingService, private http: HTTPServer) {
    super('Messaging', logger, Router({ mergeParams: true }))
    this.legacy = new MessagingLegacy(logger, http)
  }

  public setupRoutes(): void {
    this.router.post(
      '/receive',
      this.asyncMiddleware(async (req, res, next) => {
        if (req.headers.password !== process.INTERNAL_PASSWORD) {
          return next?.(new UnauthorizedError('Password is missing or invalid'))
        }

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
    )

    this.legacy.setup()
  }
}

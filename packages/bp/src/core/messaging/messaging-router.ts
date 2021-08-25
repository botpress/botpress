import * as sdk from 'botpress/sdk'
import { StandardError, UnauthorizedError } from 'common/http'
import { HTTPServer } from 'core/app/server'
import { CustomRouter } from 'core/routers/customRouter'
import { Router } from 'express'
import joi from 'joi'
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
        if (!this.messaging.isExternal && req.headers.password !== process.INTERNAL_PASSWORD) {
          return next?.(new UnauthorizedError('Password is missing or invalid'))
        } else if (
          this.messaging.isExternal &&
          req.headers['x-webhook-token'] !== this.messaging.getWebhookToken(req?.body?.client?.id)
        ) {
          return next?.(new UnauthorizedError('Invalid webhook token'))
        }

        if (req.body?.type === 'health') {
          return res.sendStatus(200)
        }

        try {
          await joi.validate(req.body, ReceiveSchema)
        } catch (err) {
          throw new StandardError('Invalid payload', err)
        }

        const msg = req.body as ReceiveRequest

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
    )

    this.legacy.setup()
  }
}

interface ReceiveRequest {
  type: string
  client: { id: string }
  channel: { name: string }
  user: { id: string }
  conversation: { id: string }
  message: { id: string; conversationId: string; authorId: string | undefined; sentOn: Date; payload: any }
}

const ReceiveSchema = {
  type: joi.string().required(),
  client: joi.object({ id: joi.string().required() }),
  channel: joi.object({ name: joi.string().required() }),
  user: joi.object({ id: joi.string().required() }),
  conversation: joi.object({ id: joi.string().required() }),
  message: joi.object({
    id: joi.string().required(),
    conversationId: joi.string().required(),
    authorId: joi.string().required(),
    sentOn: joi.date().required(),
    payload: joi.object().required()
  })
}

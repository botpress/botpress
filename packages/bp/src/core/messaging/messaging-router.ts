import { Message } from '@botpress/messaging-client'
import * as sdk from 'botpress/sdk'
import { UnauthorizedError } from 'common/http'
import { HTTPServer } from 'core/app/server'
import { CustomRouter } from 'core/routers/customRouter'
import { Router } from 'express'
import joi from 'joi'
import { MessagingLegacy } from './legacy'
import { MessagingService } from './messaging-service'
import { NextFunction, Request, Response } from 'express'

export class MessagingRouter extends CustomRouter {
  private legacy: MessagingLegacy

  constructor(logger: sdk.Logger, private messaging: MessagingService, http: HTTPServer) {
    super('Messaging', logger, Router({ mergeParams: true }))
    this.legacy = new MessagingLegacy(logger, http)
  }

  public setupRoutes(): void {
    this.router.post(
      '/receive',
      this.validateRequest,
      this.asyncMiddleware(async (req, res) => {
        const event: MessagingEvent = req.body

        if (event.type === 'message.new') {
          const { error } = MessageNewEventSchema.validate(req.body)
          if (error) {
            return res.status(400).send(error.message)
          }

          await this.messaging.receive(req.body as MessageNewEventData)
        } else if (event.type === 'user.new') {
          this.messaging.incrementNewUsersCount()
        }

        return res.sendStatus(200)
      })
    )

    this.legacy.setup()
  }

  private validateRequest(req: Request, res: Response, next: NextFunction | undefined) {
    if (this.messaging.isExternal) {
      if (req.headers.password !== process.INTERNAL_PASSWORD) {
        return next?.(new UnauthorizedError('Password is missing or invalid'))
      }
    } else {
      const token = req.headers['x-webhook-token']

      if (!token || token !== this.messaging.getWebhookToken(req.body?.clientId)) {
        return next?.(new UnauthorizedError('Invalid webhook token'))
      }
    }
  }
}

export interface MessageNewEventData {
  clientId: string
  userId: string
  conversationId: string
  channel: string
  message: Message
}

interface MessagingEvent {
  type: string
  data: any
}

const MessageNewEventSchema = joi.object({
  type: joi.string().required(),
  data: joi
    .object({
      clientId: joi.string().required(),
      userId: joi.string().required(),
      conversationId: joi.string().required(),
      channel: joi.string().required(),
      message: joi
        .object({
          id: joi.string().required(),
          conversationId: joi.string().required(),
          authorId: joi.string().required(),
          sentOn: joi.date().required(),
          payload: joi.object().required()
        })
        .required()
    })
    .required()
})

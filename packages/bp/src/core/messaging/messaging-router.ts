import { Message } from '@botpress/messaging-client'
import * as sdk from 'botpress/sdk'
import { UnauthorizedError } from 'common/http'
import { HTTPServer } from 'core/app/server'
import { CustomRouter } from 'core/routers/customRouter'
import { Router, NextFunction, Request, Response } from 'express'
import joi from 'joi'
import { MessagingLegacy } from './legacy'
import { MessagingService } from './messaging-service'

export class MessagingRouter extends CustomRouter {
  private legacy: MessagingLegacy

  constructor(logger: sdk.Logger, private messaging: MessagingService, http: HTTPServer) {
    super('Messaging', logger, Router({ mergeParams: true }))
    this.legacy = new MessagingLegacy(logger, http)
  }

  public setupRoutes(): void {
    this.router.post(
      '/receive',
      this.validateRequest.bind(this),
      this.asyncMiddleware(async (req, res) => {
        const event: MessagingEvent = req.body

        if (event.type === 'message.new') {
          const { error } = MessageNewEventSchema.validate(event.data)
          if (error) {
            return res.status(400).send(error.message)
          }

          await this.messaging.receive(event.data as MessageNewEventData)
        } else if (event.type === 'conversation.started') {
          const { error } = ConversationStartedEventSchema.validate(event.data)
          if (error) {
            return res.status(400).send(error.message)
          }

          await this.messaging.conversationStarted(event.data as ConversationStartedEventData)
        } else if (event.type === 'user.new') {
          this.messaging.incrementNewUsersCount()
        }

        return res.sendStatus(200)
      })
    )

    this.legacy.setup()
  }

  private validateRequest(req: Request, res: Response, next: NextFunction) {
    if (this.messaging.isExternal) {
      const token = req.headers['x-webhook-token']

      if (!token || token !== this.messaging.getWebhookToken(req.body?.data?.clientId)) {
        return next(new UnauthorizedError('Invalid webhook token'))
      } else {
        return next(undefined)
      }
    } else {
      if (req.headers.password !== process.INTERNAL_PASSWORD) {
        return next(new UnauthorizedError('Password is missing or invalid'))
      } else {
        return next(undefined)
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
  collect: boolean
}

export interface ConversationStartedEventData {
  clientId: string
  userId: string
  conversationId: string
  channel: string
}

interface MessagingEvent {
  type: 'message.new' | 'conversation.started' | 'user.new'
  data: any
}

const MessageNewEventSchema = joi
  .object({
    clientId: joi.string().required(),
    userId: joi.string().required(),
    conversationId: joi.string().required(),
    channel: joi.string().required(),
    collect: joi.boolean().optional(),
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

const ConversationStartedEventSchema = joi
  .object({
    clientId: joi.string().required(),
    userId: joi.string().required(),
    conversationId: joi.string().required(),
    channel: joi.string().required()
  })
  .required()

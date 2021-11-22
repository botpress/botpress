import { Message } from '@botpress/messaging-client'
import * as sdk from 'botpress/runtime-sdk'

import { Router, NextFunction, Request, Response } from 'express'
import joi from 'joi'
import { CustomRouter } from 'runtime/app/server-utils'

import { MessagingService } from './messaging-service'

export class MessagingRouter extends CustomRouter {
  constructor(logger: sdk.Logger, private messaging: MessagingService) {
    super('Messaging', logger, Router({ mergeParams: true }))
    this.setupRoutes()
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
        }

        return res.sendStatus(200)
      })
    )
  }

  private validateRequest(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['x-webhook-token']

    if (!token || token !== this.messaging.getWebhookToken(req.body?.data?.clientId)) {
      return next(new Error('Invalid webhook token'))
    } else {
      return next(undefined)
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

interface MessagingEvent {
  type: 'message.new' | 'user.new'
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

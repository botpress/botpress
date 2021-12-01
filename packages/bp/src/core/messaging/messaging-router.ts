import { Message } from '@botpress/messaging-client'
import * as sdk from 'botpress/sdk'
import { UnauthorizedError } from 'common/http'
import { HTTPServer } from 'core/app/server'
import { CustomRouter } from 'core/routers/customRouter'
import { Router, NextFunction, Request, Response } from 'express'
import joi from 'joi'
import { MessagingLegacy } from './legacy'

export class MessagingRouter extends CustomRouter {
  private legacy: MessagingLegacy

  constructor(logger: sdk.Logger, http: HTTPServer) {
    super('Messaging', logger, Router({ mergeParams: true }))
    this.legacy = new MessagingLegacy(logger, http)
  }

  public setupRoutes(): void {
    this.legacy.setup()
  }
}

import * as sdk from 'botpress/sdk'
import { HTTPServer } from 'core/app/server'
import { CustomRouter } from 'core/routers/customRouter'
import { Router } from 'express'
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

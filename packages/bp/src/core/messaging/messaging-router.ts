import * as sdk from 'botpress/sdk'
import { HTTPServer } from 'core/app/server'
import { CustomRouter } from 'core/routers/customRouter'
import { Router } from 'express'
import { MessagingService } from './messaging-service'
import { MessagingLegacy } from './subservices/legacy'

export class MessagingRouter extends CustomRouter {
  private legacy: MessagingLegacy

  constructor(logger: sdk.Logger, private messagingService: MessagingService, http: HTTPServer) {
    super('Messaging', logger, Router({ mergeParams: true }))
    this.legacy = new MessagingLegacy(logger, http)
  }

  public setupRoutes() {
    this.messagingService.interactor.client.setup(this.router, '/receive')
    this.legacy.setup()
  }
}

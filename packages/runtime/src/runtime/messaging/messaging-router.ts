import * as sdk from 'botpress/sdk'
import { Router } from 'express'
import { CustomRouter } from '../app/server-utils'
import { MessagingService } from './messaging-service'

export class MessagingRouter extends CustomRouter {
  constructor(logger: sdk.Logger, private messagingService: MessagingService) {
    super('Messaging', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  public setupRoutes() {
    this.messagingService.messaging.setup(this.router, '/receive')
  }
}

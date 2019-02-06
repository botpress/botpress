import { Logger } from 'botpress/sdk'
import { Router } from 'express'

import { AsyncMiddleware, asyncMiddleware } from './util'

export abstract class CustomRouter {
  protected readonly asyncMiddleware: AsyncMiddleware
  public readonly router: Router
  constructor(name: string, logger: Logger, router: Router) {
    this.asyncMiddleware = asyncMiddleware(logger, name)
    this.router = router
  }
}

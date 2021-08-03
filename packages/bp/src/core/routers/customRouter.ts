import { Logger } from 'botpress/sdk'
import { AsyncMiddleware, asyncMiddleware } from 'common/http'
import { Router } from 'express'

export abstract class CustomRouter {
  protected readonly asyncMiddleware: AsyncMiddleware
  public readonly router: Router
  constructor(name: string, logger: Logger, router: Router) {
    this.asyncMiddleware = asyncMiddleware(logger, name)
    this.router = router
  }
}

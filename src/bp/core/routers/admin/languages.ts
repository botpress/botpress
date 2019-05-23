import { Logger } from 'botpress/sdk'
import { Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '../customRouter'
import { BadRequestError } from '../errors'
import { success as sendSuccess } from '../util'

export class LanguagesRouter extends CustomRouter {
  constructor(logger: Logger) {
    super('Languages', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    // TODO Move LanguageSources from NLU Module to Here

    // GET /sources
    // GET /:source
    // POST /:source/remove/:lang
    // POST /:source/download/:lang
    // POST /:source/load/:lang

    router.get(
      '/status',
      this.asyncMiddleware(async (req, res) => {
        return sendSuccess(res, 'License status', {})
      })
    )
  }
}

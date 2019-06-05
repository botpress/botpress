import { Logger } from 'botpress/sdk'
import { ModuleLoader } from 'core/module-loader'
import { Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '../customRouter'
import { success as sendSuccess } from '../util'

export class LanguagesRouter extends CustomRouter {
  constructor(logger: Logger, private moduleLoader: ModuleLoader) {
    super('Languages', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/status',
      this.asyncMiddleware(async (req, res) => {
        return sendSuccess(res, 'License status', {})
      })
    )

    router.get(
      '/sources',
      this.asyncMiddleware(async (req, res) => {
        const config = await this.moduleLoader.configReader.getGlobal('nlu')
        res.json({
          languageSources: config.languageSources
        })
      })
    )
  }
}

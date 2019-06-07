import Axios from 'axios'
import { Logger } from 'botpress/sdk'
import { ModuleLoader } from 'core/module-loader'
import { Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '../customRouter'

export class LanguagesRouter extends CustomRouter {
  constructor(logger: Logger, private moduleLoader: ModuleLoader) {
    super('Languages', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/sources',
      this.asyncMiddleware(async (req, res) => {
        const config = await this.moduleLoader.configReader.getGlobal('nlu')
        res.json({
          languageSources: config.languageSources
        })
      })
    )

    router.get(
      '/available',
      this.asyncMiddleware(async (req, res) => {
        const config = await this.moduleLoader.configReader.getGlobal('nlu')
        const langSource = config.languageSources[0]

        // TODO use token
        const { data } = await Axios.get(`${langSource.endpoint}/languages`)

        res.send({
          languages: data.installed
            .filter(x => x.loaded)
            .map(x => ({
              ...data.available.find(l => l.code === x.lang)
            }))
        })
      })
    )
  }
}

import axios from 'axios'
import { Logger } from 'botpress/sdk'
import { ModuleLoader } from 'core/module-loader'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '../customRouter'
import { needPermissions } from '../util'

export class LanguagesRouter extends CustomRouter {
  private needPermissions: (operation: string, resource: string) => RequestHandler
  private readonly resource = 'admin.languages'

  constructor(logger: Logger, private moduleLoader: ModuleLoader, private workspaceService: WorkspaceService) {
    super('Languages', logger, Router({ mergeParams: true }))
    this.needPermissions = needPermissions(this.workspaceService)
    this.setupRoutes()
  }

  async getSourceClient() {
    const config = await this.moduleLoader.configReader.getGlobal('nlu')
    const source = config.languageSources[0]

    const headers = {
      timeout: 20000,
      ...(source.authToken && { authorization: 'bearer ' + source.authToken })
    }
    return axios.create({ baseURL: source.endpoint, headers })
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        try {
          const client = await this.getSourceClient()
          await client.get('/languages').then(({ data }) => res.send(data))
        } catch (err) {
          res.status(500).send(err.message)
        }
      })
    )

    router.get(
      '/sources',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        const config = await this.moduleLoader.configReader.getGlobal('nlu')
        res.send({
          languageSources: config.languageSources
        })
      })
    )

    router.get(
      '/info',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        try {
          const client = await this.getSourceClient()
          await client.get('/info').then(({ data }) => res.send(data))
        } catch (err) {
          res.status(500).send(err.message)
        }
      })
    )

    router.post(
      '/:lang',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        try {
          const client = await this.getSourceClient()
          await client.post('/languages/' + req.params.lang).then(({ data }) => res.send(data))
        } catch (err) {
          res.status(500).send(err)
        }
      })
    )

    router.post(
      '/:lang/load',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        try {
          const client = await this.getSourceClient()
          await client.post(`/languages/${req.params.lang}/load`).then(({ data }) => res.send(data))
        } catch (err) {
          res.status(500).send(err.message)
        }
      })
    )

    router.delete(
      '/:lang',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        try {
          const client = await this.getSourceClient()
          await client.delete('/languages/' + req.params.lang).then(({ data }) => res.send(data))
        } catch (err) {
          res.status(500).send(err.message)
        }
      })
    )

    router.get(
      '/available',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        try {
          const client = await this.getSourceClient()
          const { data } = await client.get('/languages')
          res.send({
            languages: data.installed
              .filter(x => x.loaded)
              .map(x => ({
                ...data.available.find(l => l.code === x.lang)
              }))
          })
        } catch (err) {
          res.status(500).send(err)
        }
      })
    )
  }
}

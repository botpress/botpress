import axios from 'axios'
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
      this.asyncMiddleware(async (req, res) => {
        const config = await this.moduleLoader.configReader.getGlobal('nlu')
        res.send({
          languageSources: config.languageSources
        })
      })
    )

    router.get(
      '/info',
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

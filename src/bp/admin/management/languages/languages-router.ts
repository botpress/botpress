import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import axios from 'axios'
import { StandardError, UnexpectedError } from 'common/http'
import Joi from 'joi'
import _ from 'lodash'

class LanguagesRouter extends CustomAdminRouter {
  private readonly resource = 'admin.languages'

  constructor(services: AdminServices) {
    super('Languages', services)
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

  private async getExtraLangs(): Promise<any[]> {
    const { additionalLanguages } = await this.configProvider.getBotpressConfig()
    const { error } = Joi.validate(
      additionalLanguages,
      Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          code: Joi.string().required()
        })
      )
    )

    if (error) {
      this.logger.warn('Additional languages are not valid')
      return []
    }

    return additionalLanguages || []
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        try {
          const client = await this.getSourceClient()
          const { data } = await client.get('/languages')

          res.send({
            ...data,
            ...(await this.getExtraLangs())
          })
        } catch (err) {
          throw new UnexpectedError('Could not fetch languages', err)
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
          throw new StandardError('Could not get language info', err)
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
          throw new StandardError('Could not add language', err)
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
          throw new StandardError('Could not load language', err)
        }
      })
    )

    router.post(
      '/:lang/delete',
      this.needPermissions('write', this.resource),
      this.asyncMiddleware(async (req, res) => {
        try {
          const client = await this.getSourceClient()
          await client.post(`/languages/${req.params.lang}/delete`).then(({ data }) => res.send(data))
        } catch (err) {
          throw new StandardError('Could not delete language', err)
        }
      })
    )

    router.get(
      '/available',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        let languagesData: any = { installed: [], available: [] }
        try {
          const client = await this.getSourceClient()
          languagesData = (await client.get('/languages')).data
        } catch (e) {
          try {
            const { languageSources } = await this.moduleLoader.configReader.getGlobal('nlu')
            if (languageSources.length && languageSources[0].endpoint) {
              this.logger.warn("Please remove the languageSources from nlu.json if you don't want to use it")
            }
          } catch (e) {
            this.logger.warn('NLU module is disabled')
          }
        }

        const languages = [
          ...languagesData.installed
            .filter(x => x.loaded)
            .map(x => ({
              ...languagesData.available.find(l => l.code === x.lang)
            })),
          ...(await this.getExtraLangs())
        ]

        res.send({ languages })
      })
    )
  }
}

export default LanguagesRouter

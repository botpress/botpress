import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import axios, { AxiosInstance } from 'axios'
import { StandardError, UnexpectedError } from 'common/http'
import Joi from 'joi'
import _ from 'lodash'

const NO_LANG_SOURCES_MSG = 'Your Botpress config has no defined language sources.'

class LanguagesRouter extends CustomAdminRouter {
  private readonly resource = 'admin.languages'

  constructor(services: AdminServices) {
    super('Languages', services)
    this.setupRoutes()
  }

  private async _getSourceClient(): Promise<AxiosInstance | undefined> {
    const { nlu: nluConfig } = await this.configProvider.getBotpressConfig()

    const { nluServer: nluServerConfig } = nluConfig
    if (!nluServerConfig) {
      return
    }
    const { languageSources } = nluServerConfig
    if (!languageSources) {
      return
    }

    const source = languageSources[0]

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
          const client = await this._getSourceClient()
          if (!client) {
            this.logger.warn(NO_LANG_SOURCES_MSG)
            return res.status(404).send(NO_LANG_SOURCES_MSG)
          }

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
        const { nlu: nluConfig } = await this.configProvider.getBotpressConfig()
        const { nluServer: nluServerConfig } = nluConfig
        if (!nluServerConfig) {
          this.logger.warn(NO_LANG_SOURCES_MSG)
          return res.status(404).send(NO_LANG_SOURCES_MSG)
        }

        res.send({
          languageSources: nluServerConfig.languageSources
        })
      })
    )

    router.get(
      '/info',
      this.needPermissions('read', this.resource),
      this.asyncMiddleware(async (req, res) => {
        try {
          const client = await this._getSourceClient()
          if (!client) {
            this.logger.warn(NO_LANG_SOURCES_MSG)
            return res.status(404).send(NO_LANG_SOURCES_MSG)
          }

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
          const client = await this._getSourceClient()
          if (!client) {
            this.logger.warn(NO_LANG_SOURCES_MSG)
            return res.status(404).send(NO_LANG_SOURCES_MSG)
          }

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
          const client = await this._getSourceClient()
          if (!client) {
            this.logger.warn(NO_LANG_SOURCES_MSG)
            return res.status(404).send(NO_LANG_SOURCES_MSG)
          }

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
          const client = await this._getSourceClient()
          if (!client) {
            this.logger.warn(NO_LANG_SOURCES_MSG)
            return res.status(404).send(NO_LANG_SOURCES_MSG)
          }

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
        const client = await this._getSourceClient()
        if (!client) {
          this.logger.warn(NO_LANG_SOURCES_MSG)
          return res.status(404).send(NO_LANG_SOURCES_MSG)
        }

        try {
          languagesData = (await client.get('/languages')).data
        } catch (e) {
          this.logger.warn('Language server is unreachable.')
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

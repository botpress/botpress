import { ContentElement } from 'botpress/sdk'
import { AdminService } from 'core/services/admin/service'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { DefaultSearchParams } from 'core/services/cms'
import { CMS } from 'core/services/cms/cms'
import { RequestHandler, Router } from 'express'

import { CustomRouter } from '..'
import { checkTokenHeader, needPermissions } from '../util'

export class ContentRouter implements CustomRouter {
  public readonly router: Router

  private _checkTokenHeader: RequestHandler
  private _needPermissions: (operation: string, resource: string) => RequestHandler

  constructor(private adminService: AdminService, private authService: AuthService, private cms: CMS) {
    this._needPermissions = needPermissions(this.adminService)
    this._checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)

    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get(
      '/types',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      async (req, res) => {
        const botId = req.params.botId
        const types = await this.cms.getAllContentTypes(botId)

        const response = await Promise.map(types, async type => {
          const count = await this.cms.countContentElementsForContentType(botId, type.id)
          return {
            id: type.id,
            count,
            title: type.title,
            schema: {
              json: type.jsonSchema,
              ui: type.uiSchema,
              title: type.title,
              renderer: type.id
            }
          }
        })

        res.send(response)
      }
    )

    this.router.get(
      '/elements/count',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      async (req, res) => {
        const botId = req.params.botId
        const count = await this.cms.countContentElements(botId)
        res.send({ count })
      }
    )

    this.router.get(
      '/:contentType?/elements',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      async (req, res) => {
        const { botId, contentType } = req.params
        const query = req.query || {}

        const elements = await this.cms.listContentElements(botId, contentType, {
          ...DefaultSearchParams,
          count: Number(query.count) || DefaultSearchParams.count,
          from: Number(query.from) || DefaultSearchParams.from,
          searchTerm: query.searchTerm || DefaultSearchParams.searchTerm,
          ids: (query.ids && query.ids.split(',')) || DefaultSearchParams.ids
        })

        const augmentedElements = await Promise.map(elements, this._augmentElement)
        res.send(augmentedElements)
      }
    )

    this.router.get(
      '/:contentType?/elements/count',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      async (req, res) => {
        const { botId, contentType } = req.params
        const count = await this.cms.countContentElementsForContentType(botId, contentType)
        res.send({ count })
      }
    )

    this.router.get(
      '/elements/:elementId',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      async (req, res) => {
        const { botId, elementId } = req.params
        const element = await this.cms.getContentElement(botId, elementId)
        res.send(await this._augmentElement(element))
      }
    )

    this.router.post(
      '/:contentType/elements/:elementId?',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      async (req, res) => {
        const { botId, contentType, elementId } = req.params
        const element = await this.cms.createOrUpdateContentElement(botId, contentType, req.body.formData, elementId)
        res.send(element)
      }
    )

    this.router.post(
      '/elements/bulk_delete',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      async (req, res) => {
        await this.cms.deleteContentElements(req.params.botId, req.body)
        res.sendStatus(200)
      }
    )
  }

  private _augmentElement = async (element: ContentElement) => {
    const contentType = await this.cms.getContentType(element.contentType)
    return {
      ...element,
      schema: {
        json: contentType.jsonSchema,
        ui: contentType.uiSchema,
        title: contentType.title,
        renderer: contentType.id
      }
    }
  }
}

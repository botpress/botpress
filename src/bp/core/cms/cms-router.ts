import { ContentElement, Logger } from 'botpress/sdk'
import { LibraryElement } from 'common/typings'
import { GhostService } from 'core/bpfs'
import { CMSService, DefaultSearchParams } from 'core/cms'
import { CustomRouter } from 'core/routers/customRouter'
import { AuthService, TOKEN_AUDIENCE, checkTokenHeader, needPermissions } from 'core/security'
import { WorkspaceService } from 'core/users'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'

const CONTENT_FOLDER = 'content-elements'
const LIBRARY_FILE = 'library.json'

export class CMSRouter extends CustomRouter {
  private _checkTokenHeader: RequestHandler
  private _needPermissions: (operation: string, resource: string) => RequestHandler

  constructor(
    private logger: Logger,
    private authService: AuthService,
    private cms: CMSService,
    private workspaceService: WorkspaceService,
    private ghost: GhostService
  ) {
    super('Content', logger, Router({ mergeParams: true }))
    this._needPermissions = needPermissions(this.workspaceService)
    this._checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get(
      '/types',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const types = await this.cms.getAllContentTypes(botId)

        const response = await Promise.map(types, async type => {
          const count = await this.cms.countContentElementsForContentType(botId, type.id)
          return {
            id: type.id,
            count,
            title: type.title,
            hidden: type.hidden,
            schema: {
              json: type.jsonSchema,
              ui: type.uiSchema,
              title: type.title,
              renderer: type.id
            }
          }
        })

        res.send(response)
      })
    )

    this.router.get(
      '/elements/count',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const count = await this.cms.countContentElements(botId)
        res.send({ count })
      })
    )

    this.router.post(
      '/:contentType?/elements',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, contentType } = req.params
        const { count, from, searchTerm, filters, sortOrder, ids } = req.body

        const elements = await this.cms.listContentElements(botId, contentType, {
          ...DefaultSearchParams,
          count: Number(count) || DefaultSearchParams.count,
          from: Number(from) || DefaultSearchParams.from,
          sortOrder: sortOrder || DefaultSearchParams.sortOrder,
          searchTerm,
          filters,
          ids
        })

        const augmentedElements = await Promise.map(elements, this._augmentElement)
        res.send(augmentedElements)
      })
    )

    this.router.get(
      '/:contentType?/elements/count',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, contentType } = req.params
        const count = await this.cms.countContentElementsForContentType(botId, contentType)
        res.send({ count })
      })
    )

    this.router.get(
      '/element/:elementId',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, elementId } = req.params
        const element = await this.cms.getContentElement(botId, elementId)

        if (!element) {
          this.logger.forBot(botId).warn(`The requested element doesn't exist: "${elementId}"`)
          return res.status(404).send(`Element ${elementId} not found`)
        }

        res.send(await this._augmentElement(element))
      })
    )

    this.router.post(
      '/:contentType/element/:elementId?',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, contentType, elementId } = req.params
        const element = await this.cms.createOrUpdateContentElement(botId, contentType, req.body.formData, elementId)
        res.send(element)
      })
    )

    this.router.post(
      '/elements/bulk_delete',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        await this.cms.deleteContentElements(req.params.botId, req.body)
        res.sendStatus(200)
      })
    )

    this.router.get(
      '/library/:lang?',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, lang } = req.params

        const ghost = this.ghost.forBot(botId)
        if (!(await ghost.fileExists(CONTENT_FOLDER, LIBRARY_FILE))) {
          return res.send([])
        }

        const ids = await ghost.readFileAsObject<string[]>(CONTENT_FOLDER, LIBRARY_FILE)

        const elements = await this.cms.listContentElements(botId, undefined, { ids, from: 0, count: -1 }, lang)
        const contentTypes = (await this.cms.getAllContentTypes(botId)).reduce((acc, curr) => {
          return { ...acc, [curr.id]: curr.title }
        }, {})

        return res.send(
          elements.map(x => {
            const contentType = contentTypes[x.contentType]
            return {
              path: `Content/${contentType}/${x.id}`,
              preview: x.previews[lang]?.replace(`${contentType}: `, ''),
              type: 'say_something',
              contentId: x.id
            }
          }) as LibraryElement[]
        )
      })
    )

    this.router.post(
      '/library/:contentId/delete',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, contentId } = req.params

        const ghost = this.ghost.forBot(botId)
        if (!(await ghost.fileExists(CONTENT_FOLDER, LIBRARY_FILE))) {
          return res.sendStatus(404)
        }

        const ids = await ghost.readFileAsObject<string[]>(CONTENT_FOLDER, LIBRARY_FILE)

        await ghost.upsertFile(
          CONTENT_FOLDER,
          LIBRARY_FILE,
          JSON.stringify(
            ids.filter(x => x !== contentId),
            undefined,
            2
          )
        )

        res.sendStatus(200)
      })
    )

    this.router.post(
      '/library/:contentId',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, contentId } = req.params

        const ghost = this.ghost.forBot(botId)

        let contentIds: string[] = []
        if (await ghost.fileExists(CONTENT_FOLDER, LIBRARY_FILE)) {
          contentIds = await ghost.readFileAsObject<string[]>(CONTENT_FOLDER, LIBRARY_FILE)
        }

        await ghost.upsertFile(CONTENT_FOLDER, LIBRARY_FILE, JSON.stringify([...contentIds, contentId], undefined, 2))

        res.sendStatus(200)
      })
    )

    /*
    this.router.get(
      '/export',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      async (req, res) => {
        // TODO: chunk elements if there are too many of them
        const elements = await this.cms.getAllElements(req.params.botId)
        const filtered = elements.map(x => _.omit(x, ['createdBy', 'createdOn', 'modifiedOn']))

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-disposition', `attachment; filename=content_${moment().format('DD-MM-YYYY')}.json`)
        res.end(JSON.stringify(filtered, undefined, 2))
      }
    )

    const upload = multer()
    this.router.post(
      '/analyzeImport',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      upload.single('file'),
      this.asyncMiddleware(async (req: any, res) => {
        try {
          const existingElements = await this.cms.getAllElements(req.params.botId)
          const contentTypes = (await this.cms.getAllContentTypes(req.params.botId)).map(x => x.id)

          const importData = (await validate(JSON.parse(req.file.buffer), CmsImportSchema)) as ContentElement[]
          const importedContentTypes = _.uniq(importData.map(x => x.contentType))

          res.send({
            cmsCount: (existingElements && existingElements.length) || 0,
            fileCmsCount: (importData && importData.length) || 0,
            missingContentTypes: _.difference(importedContentTypes, contentTypes)
          })
        } catch (err) {
          throw new InvalidOperationError(`Error importing your file: ${err}`)
        }
      })
    )

    this.router.post(
      '/import',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      upload.single('file'),
      async (req: any, res) => {
        if (req.body.action === 'clear_insert') {
          await this.cms.deleteAllElements(req.params.botId)
        }

        try {
          const importData: ContentElement[] = await JSON.parse(req.file.buffer)

          for (const { contentType, formData, id } of importData) {
            await this.cms.createOrUpdateContentElement(req.params.botId, contentType, formData, id)
          }

          await this.cms.loadElementsForBot(req.params.botId)
          res.sendStatus(200)
        } catch (e) {
          this.logger.attachError(e).error('JSON Import Failure')
        }
      }
    )*/
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

import { RouterOptions } from 'botpress-module-sdk'
import { Serialize } from 'cerialize'
import { Router } from 'express'
import multer from 'multer'
import path from 'path'

import { BotRepository } from '../repositories'
import ActionService from '../services/action/action-service'
import { DefaultSearchParams } from '../services/cms'
import { CMSService } from '../services/cms/cms-service'
import { FlowView } from '../services/dialog'
import FlowService from '../services/dialog/flow/service'
import { LogsService } from '../services/logs/service'
import MediaService from '../services/media'

import { CustomRouter } from '.'

export class BotsRouter implements CustomRouter {
  public readonly router: Router

  private actionService: ActionService
  private botRepository: BotRepository
  private cmsService: CMSService
  private flowService: FlowService
  private mediaService: MediaService
  private logsService: LogsService

  constructor(args: {
    actionService: ActionService
    botRepository: BotRepository
    cmsService: CMSService
    flowService: FlowService
    mediaService: MediaService
    logsService: LogsService
  }) {
    this.actionService = args.actionService
    this.botRepository = args.botRepository
    this.cmsService = args.cmsService
    this.flowService = args.flowService
    this.mediaService = args.mediaService
    this.logsService = args.logsService
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  getNewRouter(path: string, options: RouterOptions) {
    const router = Router({ mergeParams: true })
    this.router.use('/ext/' + path, router)
    return router
  }

  private setupRoutes() {
    this.router.get('/', async (request, response) => {
      const botId = request.params.botId
      const bot = await this.botRepository.getBotById(botId)

      response.send(bot)
    })

    this.router.get('/middleware', async (req, res) => {
      const botId = req.params.botId
      // const middleware = await this.middlewareService.getMiddlewareForBot(botId)

      res.send([])
    })

    this.router.post('/middleware', async (req, res) => {
      const botId = req.params.botId
      const { middleware } = req.body
      // await this.middlewareService.setMiddlewareForBot(botId, middleware)
      // res.send(await this.middlewareService.getMiddlewareForBot(botId))
    })

    this.router.get('/content/types', async (req, res) => {
      const botId = req.params.botId
      const types = await this.cmsService.getAllContentTypes(botId)

      const response = await Promise.map(types, async type => {
        const count = await this.cmsService.countContentElementsForContentType(botId, type.id)
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
    })

    this.router.get('/content/elements/count', async (req, res) => {
      const botId = req.params.botId
      const count = await this.cmsService.countContentElements(botId)
      res.send({ count })
    })

    this.router.get('/content/:contentType?/elements', async (req, res) => {
      const { botId, contentType } = req.params
      const query = req.query || {}

      const types = await this.cmsService.listContentElements(botId, contentType, {
        ...DefaultSearchParams,
        count: Number(query.count) || DefaultSearchParams.count,
        from: Number(query.from) || DefaultSearchParams.from,
        searchTerm: query.searchTerm || DefaultSearchParams.searchTerm,
        ids: (query.ids && query.ids.split(',')) || DefaultSearchParams.ids
      })

      res.send(types)
    })

    this.router.get('/content/:contentType?/elements/count', async (req, res) => {
      const { botId, contentType } = req.params
      const count = await this.cmsService.countContentElementsForContentType(botId, contentType)
      res.send({ count })
    })

    this.router.get('/content/elements/:elementId', async (req, res) => {
      const { botId, elementId } = req.params
      const element = await this.cmsService.getContentElement(botId, elementId)
      res.send(element)
    })

    this.router.post('/content/:contentType/elements/:elementId?', async (req, res) => {
      const { botId, contentType, elementId } = req.params
      const element = await this.cmsService.createOrUpdateContentElement(
        botId,
        contentType,
        req.body.formData,
        elementId
      )
      res.send(element)
    })

    this.router.get('/flows', async (req, res) => {
      const botId = req.params.botId
      const flows = await this.flowService.loadAll(botId)
      res.send(flows)
    })

    this.router.post('/flows', async (req, res) => {
      const botId = req.params.botId
      const flowViews = <FlowView[]>req.body

      await this.flowService.saveAll(botId, flowViews)
      res.sendStatus(201)
    })

    this.router.get('/actions', async (req, res) => {
      const botId = req.params.botId
      const actions = await this.actionService.forBot(botId).listActions({ includeMetadata: true })
      res.send(Serialize(actions))
    })

    const mediaUploadMulter = multer({
      limits: {
        fileSize: 1024 * 1000 * 10 // 10mb
      }
    })

    // FIXME Do not authenticate this route
    this.router.get('/media/:filename', async (req, res) => {
      const botId = req.params.botId
      const type = path.extname(req.params.filename)

      const contents = await this.mediaService.readFile(botId, req.params.filename).catch(() => undefined)
      if (!contents) {
        return res.sendStatus(404)
      }

      // files are never overwritten because of the unique ID
      // so we can set the header to cache the asset for 1 year
      return res
        .set({ 'Cache-Control': 'max-age=31556926' })
        .type(type)
        .send(contents)
    })

    this.router.post('/media', mediaUploadMulter.single('file'), async (req, res) => {
      const botId = req.params.botId
      const fileName = await this.mediaService.saveFile(botId, req['file'].originalname, req['file'].buffer)
      const url = `/api/v1/bots/${botId}/media/${fileName}`
      res.json({ url })
    })

    this.router.get('/logs', async (req, res) => {
      const limit = req.query.limit
      const botId = req.params.botId
      const logs = await this.logsService.getLogsForBot(botId, limit)
      res.send(logs)
    })
  }
}

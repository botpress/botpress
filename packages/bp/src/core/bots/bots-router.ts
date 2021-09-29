import { Logger, RouterOptions } from 'botpress/sdk'
import { HTTPServer } from 'core/app/server'
import { BotService } from 'core/bots'
import { ConfigProvider } from 'core/config'
import { ConverseRouter, ConverseService } from 'core/converse'
import { EventRepository } from 'core/events'
import { MediaServiceProvider } from 'core/media'
import { MessagingBotRouter } from 'core/messaging'
import { NLUInferenceService } from 'core/nlu'
import { NLUInferenceRouter } from 'core/nlu/nlu-inference-router'
import { QnaRouter, QnaService } from 'core/qna'
import { disableForModule } from 'core/routers'
import {
  AuthService,
  TOKEN_AUDIENCE,
  checkMethodPermissions,
  checkTokenHeader,
  needPermissions,
  checkBotVisibility
} from 'core/security'
import { WorkspaceService } from 'core/users'
import express, { Express, RequestHandler, Router } from 'express'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import path from 'path'
import { URL } from 'url'

import { CustomRouter } from '../routers/customRouter'

export class BotsRouter extends CustomRouter {
  private checkTokenHeader: RequestHandler
  private needPermissions: (operation: string, resource: string) => RequestHandler
  private checkMethodPermissions: (resource: string) => RequestHandler
  private converseRouter: ConverseRouter
  private messagingRouter: MessagingBotRouter
  private qnaRouter: QnaRouter
  private nluInferenceRouter: NLUInferenceRouter

  constructor(
    private botService: BotService,
    private configProvider: ConfigProvider,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private converseService: ConverseService,
    private logger: Logger,
    private mediaServiceProvider: MediaServiceProvider,
    private eventRepo: EventRepository,
    private qnaService: QnaService,
    private nluInferenceService: NLUInferenceService,
    private httpServer: HTTPServer
  ) {
    super('Bots', logger, Router({ mergeParams: true }))

    this.needPermissions = needPermissions(this.workspaceService)
    this.checkMethodPermissions = checkMethodPermissions(this.workspaceService)
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)

    this.converseRouter = new ConverseRouter(
      this.logger,
      this.converseService,
      this.authService,
      this.httpServer,
      this.configProvider
    )
    this.messagingRouter = new MessagingBotRouter(this.logger, this.authService, this.eventRepo)
    this.qnaRouter = new QnaRouter(this.logger, this.authService, this.workspaceService, this.qnaService)
    this.nluInferenceRouter = new NLUInferenceRouter(
      this.logger,
      this.authService,
      this.workspaceService,
      this.nluInferenceService
    )
  }

  async setupRoutes(app: express.Express) {
    app.use('/api/v1/bots/:botId', this.router)
    this.router.use(checkBotVisibility(this.configProvider, this.checkTokenHeader))

    this.router.use('/converse', this.converseRouter.router)
    this.router.use('/messaging', this.messagingRouter.router)
    this.router.use('/qna', this.qnaRouter.router)
    this.router.use('/nlu', this.nluInferenceRouter.router)

    this.router.get(
      '/media/:filename',
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const type = path.extname(req.params.filename)

        const mediaService = this.mediaServiceProvider.forBot(botId)
        const contents = await mediaService.readFile(req.params.filename).catch(() => undefined)
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
    )

    this.router.get(
      '/',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.information'),
      this.asyncMiddleware(async (req, res) => {
        const bot = await this.botService.findBotById(req.params.botId)
        if (!bot) {
          return res.sendStatus(404)
        }

        res.send(bot)
      })
    )

    this.router.get(
      '/workspaceBotsIds',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.information'),
      this.asyncMiddleware(async (req, res) => {
        const botsRefs = await this.workspaceService.getBotRefs(req.workspace)
        const bots = await this.botService.findBotsByIds(botsRefs)

        return res.send(bots?.filter(Boolean).map(x => ({ name: x.name, id: x.id })))
      })
    )

    const config = (await this.configProvider.getBotpressConfig()).eventCollector

    this.router.get('/events/update-frequency', async (_req, res) => {
      res.send({ collectionInterval: config.collectionInterval })
    })

    this.router.get(
      '/events/:eventId',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const storedEvents = await this.eventRepo.findEvents({
          incomingEventId: req.params.eventId,
          direction: 'incoming',
          botId: req.params.botId
        })
        if (storedEvents.length) {
          return res.send(storedEvents.map(s => s.event)[0])
        }

        res.sendStatus(404)
      })
    )
  }

  /**
   * There is no built-in API in express to remove routes at runtime. Therefore, it is recommended to use this method in development only.
   * A good explanation is available here: https://github.com/expressjs/express/issues/2596
   */
  deleteRouter(path: string, app: Express) {
    const relPath = `/mod/${path}`

    // We need to access the global stack and dig in it to find the desired stack
    const mainRouterStack = app._router.stack
    const botRouter = mainRouterStack.find(x => x.name === 'router' && x.regexp.exec('/api/v1/bots/:botId'))

    if (botRouter) {
      botRouter.handle.stack = botRouter.handle.stack.filter(x => !x.regexp.exec(relPath))
    }
  }

  getNewRouter(path: string, identity: string, options?: RouterOptions): Router {
    const router = Router({ mergeParams: true })
    if (_.get(options, 'checkAuthentication', true)) {
      router.use(this.checkTokenHeader)

      if (options?.checkMethodPermissions) {
        router.use(this.checkMethodPermissions(identity))
      } else {
        router.use(this.needPermissions('write', identity))
      }
    }

    if (!_.get(options, 'enableJsonBodyParser', true)) {
      disableForModule('bodyParserJson', path)
    }

    if (!_.get(options, 'enableUrlEncoderBodyParser', true)) {
      disableForModule('bodyParserUrlEncoder', path)
    }

    const relPath = `/mod/${path}`
    this.router.use(relPath, router)

    router['getPublicPath'] = async () => {
      await AppLifecycle.waitFor(AppLifecycleEvents.HTTP_SERVER_READY)
      const externalUrl = new URL(process.EXTERNAL_URL)
      const subPath = `${externalUrl.pathname}/api/v1/bots/BOT_ID${relPath}`
      return new URL(subPath.replace('//', '/'), externalUrl.origin).href
    }

    return router
  }
}

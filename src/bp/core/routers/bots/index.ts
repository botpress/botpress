/*---------------------------------------------------------------------------------------------
*  Copyright (c) Botpress, Inc. All rights reserved.
*  Licensed under the AGPL-3.0 license. See license.txt at project root for more information.
*--------------------------------------------------------------------------------------------*/

import { Logger, RouterOptions } from 'botpress/sdk'
import { Serialize } from 'cerialize'
import { gaId, machineUUID } from 'common/stats'
import { BotpressConfig } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import { BotRepository } from 'core/repositories'
import { GhostService } from 'core/services'
import ActionService from 'core/services/action/action-service'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { FlowView } from 'core/services/dialog'
import { FlowService } from 'core/services/dialog/flow/service'
import { LogsService } from 'core/services/logs/service'
import MediaService from 'core/services/media'
import { NotificationsService } from 'core/services/notification/service'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import multer from 'multer'
import path from 'path'

import { CustomRouter } from '../customRouter'
import { checkTokenHeader, needPermissions } from '../util'

export class BotsRouter extends CustomRouter {
  private actionService: ActionService
  private botRepository: BotRepository
  private configProvider: ConfigProvider
  private flowService: FlowService
  private mediaService: MediaService
  private logsService: LogsService
  private notificationService: NotificationsService
  private authService: AuthService
  private ghostService: GhostService
  private checkTokenHeader: RequestHandler
  private needPermissions: (operation: string, resource: string) => RequestHandler
  private machineId: string | undefined
  private botpressConfig: BotpressConfig | undefined
  private workspaceService: WorkspaceService

  constructor(args: {
    actionService: ActionService
    botRepository: BotRepository
    configProvider: ConfigProvider
    flowService: FlowService
    mediaService: MediaService
    logsService: LogsService
    notificationService: NotificationsService
    authService: AuthService
    ghostService: GhostService
    workspaceService: WorkspaceService
    logger: Logger
  }) {
    super('Bots', args.logger, Router({ mergeParams: true }))
    this.actionService = args.actionService
    this.botRepository = args.botRepository
    this.configProvider = args.configProvider
    this.flowService = args.flowService
    this.mediaService = args.mediaService
    this.logsService = args.logsService
    this.notificationService = args.notificationService
    this.authService = args.authService
    this.ghostService = args.ghostService
    this.workspaceService = args.workspaceService
    this.needPermissions = needPermissions(this.workspaceService)
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
  }

  async initialize() {
    this.botpressConfig = await this.configProvider.getBotpressConfig()
    this.machineId = await machineUUID()
    this.setupRoutes()
  }

  getNewRouter(path: string, options?: RouterOptions) {
    const router = Router({ mergeParams: true })
    if (_.get(options, 'checkAuthentication', true)) {
      router.use(this.checkTokenHeader)
    }

    this.router.use('/mod/' + path, router)
    return router
  }

  private studioParams(botId) {
    return {
      botId,
      authentication: {
        tokenDuration: ms('6h')
      },
      sendUsageStats: this.botpressConfig!.sendUsageStats,
      uuid: this.machineId,
      gaId: gaId,
      ghostEnabled: this.ghostService.enabled,
      flowEditorDisabled: !process.IS_LICENSED,
      botpress: {
        name: 'Botpress Studio',
        version: process.BOTPRESS_VERSION
      },
      isLicensed: process.IS_LICENSED,
      isPro: process.IS_PRO_ENABLED
    }
  }

  private setupRoutes() {
    // Unauthenticated, don't return sensitive info here
    this.router.get('/studio-params', (req, res) => {
      const info = this.studioParams(req.params.botId)
      res.send(info)
    })

    this.router.get(
      '/:app(studio|lite)/js/env.js',
      this.asyncMiddleware(async (req, res) => {
        const { botId, app } = req.params
        let botName

        try {
          const botDetails = await this.botRepository.getBotById(botId)
          botName = botDetails.name
        } catch (err) {
          return res.sendStatus(404)
        }

        const data = this.studioParams(botId)
        const liteEnv = `
              // Lite Views Specific
          `
        const studioEnv = `
              // Botpress Studio Specific
              window.AUTH_TOKEN_DURATION = ${data.authentication.tokenDuration};
              window.SEND_USAGE_STATS = ${data.sendUsageStats};
              window.GHOST_ENABLED = ${data.ghostEnabled};
              window.BOTPRESS_FLOW_EDITOR_DISABLED = ${data.flowEditorDisabled};
              window.BOTPRESS_CLOUD_SETTINGS = {"botId":"","endpoint":"","teamId":"","env":"dev"};
              window.IS_LICENSED = ${data.isLicensed};
              window.IS_PRO_ENABLED = '${data.isPro}';
          `

        const totalEnv = `
          (function(window) {
              // Common
              window.UUID = "${data.uuid}"
              window.ANALYTICS_ID = "${data.gaId}";
              window.API_PATH = "/api/v1";
              window.BOT_API_PATH = "/api/v1/bots/${botId}";
              window.BOT_ID = "${botId}";
              window.BOT_NAME = "${botName}";
              window.BP_BASE_PATH = "/${app}/${botId}";
              window.BOTPRESS_VERSION = "${data.botpress.version}";
              window.APP_NAME = "${data.botpress.name}";
              window.NODE_ENV = "production";
              window.BOTPRESS_ENV = "dev";
              window.BOTPRESS_CLOUD_ENABLED = false;
              window.DEV_MODE = true;
              ${app === 'studio' ? studioEnv : ''}
              ${app === 'lite' ? liteEnv : ''}
              // End
            })(typeof window != 'undefined' ? window : {})
          `

        res.contentType('text/javascript')
        res.send(totalEnv)
      })
    )

    this.router.get(
      '/',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.information'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const bot = await this.botRepository.getBotById(botId)

        res.send(bot)
      })
    )

    this.router.get(
      '/flows',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.flows'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const flows = await this.flowService.loadAll(botId)
        res.send(flows)
      })
    )

    this.router.post(
      '/flows',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.flows'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const flowViews = <FlowView[]>req.body

        await this.flowService.saveAll(botId, flowViews)
        res.sendStatus(201)
      })
    )

    this.router.get(
      '/actions',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.flows'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const actions = await this.actionService.forBot(botId).listActions({ includeMetadata: true })
        res.send(Serialize(actions))
      })
    )

    const mediaUploadMulter = multer({
      limits: {
        fileSize: 1024 * 1000 * 10 // 10mb
      }
    })

    // This is not a bug: do not authenticate this route
    this.router.get(
      '/media/:filename',
      this.asyncMiddleware(async (req, res) => {
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
    )

    this.router.post(
      '/media',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.media'),
      mediaUploadMulter.single('file'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const fileName = await this.mediaService.saveFile(botId, req['file'].originalname, req['file'].buffer)
        const url = `/api/v1/bots/${botId}/media/${fileName}`
        res.json({ url })
      })
    )

    this.router.get(
      '/logs',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.logs'),
      this.asyncMiddleware(async (req, res) => {
        const limit = req.query.limit
        const botId = req.params.botId
        const logs = await this.logsService.getLogsForBot(botId, limit)
        res.send(logs)
      })
    )

    this.router.get(
      '/logs/archive',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.logs'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const logs = await this.logsService.getLogsForBot(botId)
        res.setHeader('Content-type', 'text/plain')
        res.setHeader('Content-disposition', 'attachment; filename=logs.txt')
        res.send(
          logs
            .map(({ timestamp, level, message }) => {
              const time = moment(new Date(timestamp)).format('MMM DD HH:mm:ss')
              return `${time} ${level}: ${message}`
            })
            .join('\n')
        )
      })
    )

    this.router.get(
      '/notifications',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.notifications'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const notifications = await this.notificationService.getInbox(botId)
        res.send(notifications)
      })
    )

    this.router.get(
      '/notifications/archive',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.notifications'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const notifications = await this.notificationService.getArchived(botId)
        res.send(notifications)
      })
    )

    this.router.post(
      '/notifications/:notificationId?/read',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.notifications'),
      this.asyncMiddleware(async (req, res) => {
        const notificationId = req.params.notificationId
        const botId = req.params.botId

        notificationId
          ? await this.notificationService.markAsRead(notificationId)
          : await this.notificationService.markAllAsRead(botId)
        res.sendStatus(201)
      })
    )

    this.router.post(
      '/notifications/:notificationId?/archive',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.notifications'),
      this.asyncMiddleware(async (req, res) => {
        const notificationId = req.params.notificationId
        const botId = req.params.botId
        notificationId
          ? await this.notificationService.archive(notificationId)
          : await this.notificationService.archiveAll(botId)
        res.sendStatus(201)
      })
    )
  }
}

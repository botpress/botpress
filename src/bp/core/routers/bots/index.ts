/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Botpress, Inc. All rights reserved.
 *  Licensed under the AGPL-3.0 license. See license.txt at project root for more information.
 *--------------------------------------------------------------------------------------------*/

import { Logger, RouterOptions } from 'botpress/sdk'
import { Serialize } from 'cerialize'
import { gaId, machineUUID } from 'common/stats'
import { BotpressConfig } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import { asBytes } from 'core/misc/utils'
import { GhostService } from 'core/services'
import ActionService from 'core/services/action/action-service'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { BotService } from 'core/services/bot-service'
import { FlowView } from 'core/services/dialog'
import { FlowService } from 'core/services/dialog/flow/service'
import { LogsService } from 'core/services/logs/service'
import MediaService from 'core/services/media'
import { NotificationsService } from 'core/services/notification/service'
import { WorkspaceService } from 'core/services/workspace-service'
import { Express, RequestHandler, Router } from 'express'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import multer from 'multer'
import path from 'path'
import { URL } from 'url'

import { disableForModule } from '../conditionalMiddleware'
import { CustomRouter } from '../customRouter'
import { NotFoundError } from '../errors'
import { checkTokenHeader, needPermissions } from '../util'

const debugMedia = DEBUG('audit:action:media-upload')
const DEFAULT_MAX_SIZE = '10mb'

export class BotsRouter extends CustomRouter {
  private actionService: ActionService
  private botService: BotService
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
  private mediaPathRegex: RegExp

  constructor(args: {
    actionService: ActionService
    botService: BotService
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
    this.botService = args.botService
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
    this.mediaPathRegex = new RegExp(/^\/api\/v(\d)\/bots\/[A-Z0-9_-]+\/media\//, 'i')
  }

  async initialize() {
    this.botpressConfig = await this.configProvider.getBotpressConfig()
    this.machineId = await machineUUID()
    this.router.use(this.checkBotVisibility)
    this.setupRoutes()
  }

  checkBotVisibility = async (req, res, next) => {
    // '___' is a non-valid botId, but here acts as for "all bots"
    // This is used in modules when they setup routes that work on a global level (they are not tied to a specific bot)
    // Check the 'sso-login' module for an example
    if (req.params.botId === '___' || req.originalUrl.endsWith('env.js')) {
      return next()
    }

    const config = await this.configProvider.getBotConfig(req.params.botId)
    if (config.disabled) {
      return next(new NotFoundError('Bot is disabled'))
    }

    if (config.private && !this.mediaPathRegex.test(req.originalUrl)) {
      return this.checkTokenHeader(req, res, next)
    }

    next()
  }

  /**
   * There is no built-in API in express to remove routes at runtime. Therefore, it is recommended to use this method in development only.
   * A good explanation is available here: https://github.com/expressjs/express/issues/2596
   */
  deleteRouter(path: string, app: Express) {
    const relPath = '/mod/' + path

    // We need to access the global stack and dig in it to find the desired stack
    const mainRouterStack = app._router.stack
    const botRouter = mainRouterStack.find(x => x.name === 'router' && x.regexp.exec('/api/v1/bots/:botId'))

    if (botRouter) {
      botRouter.handle.stack = botRouter.handle.stack.filter(x => !x.regexp.exec(relPath))
    }
  }

  getNewRouter(path: string, identity: string, options?: RouterOptions) {
    const router = Router({ mergeParams: true })
    if (_.get(options, 'checkAuthentication', true)) {
      router.use(this.checkTokenHeader)
      router.use(this.needPermissions('write', identity))
    }

    if (!_.get(options, 'enableJsonBodyParser', true)) {
      disableForModule('bodyParser', path)
    }

    const relPath = '/mod/' + path
    this.router.use(relPath, router)

    router['getPublicPath'] = async () => {
      await AppLifecycle.waitFor(AppLifecycleEvents.HTTP_SERVER_READY)
      return new URL('/api/v1/bots/BOT_ID' + relPath, process.EXTERNAL_URL).href
    }

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
      flowEditorDisabled: !process.IS_LICENSED,
      botpress: {
        name: 'Botpress Studio',
        version: process.BOTPRESS_VERSION
      }
    }
  }

  private setupRoutes() {
    /**
     * UNAUTHENTICATED ROUTES
     * Do not return sensitive informations there. These must be accessible by unauthenticated users
     */
    this.router.get('/studio-params', (req, res) => {
      const info = this.studioParams(req.params.botId)
      res.send(info)
    })

    this.router.get(
      '/:app(studio|lite)/js/env.js',
      this.asyncMiddleware(async (req, res) => {
        const { botId, app } = req.params

        const bot = await this.botService.findBotById(botId)
        if (!bot) {
          return res.sendStatus(404)
        }

        const config = await this.configProvider.getBotpressConfig()

        const data = this.studioParams(botId)
        const liteEnv = `
              // Lite Views Specific
          `
        const studioEnv = `
              // Botpress Studio Specific
              window.AUTH_TOKEN_DURATION = ${data.authentication.tokenDuration};
              window.SEND_USAGE_STATS = ${data.sendUsageStats};
              window.BOTPRESS_FLOW_EDITOR_DISABLED = ${data.flowEditorDisabled};
          `

        const totalEnv = `
          (function(window) {
              // Common
              window.UUID = "${data.uuid}"
              window.ANALYTICS_ID = "${data.gaId}";
              window.API_PATH = "/api/v1";
              window.BOT_API_PATH = "/api/v1/bots/${botId}";
              window.BOT_ID = "${botId}";
              window.BOT_NAME = "${bot.name}";
              window.BP_BASE_PATH = "/${app}/${botId}";
              window.BOTPRESS_VERSION = "${data.botpress.version}";
              window.APP_NAME = "${data.botpress.name}";
              window.SHOW_POWERED_BY = ${!!config.showPoweredBy};
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

    /**
     * END UNAUTHENTICATED ROUTES
     * All routes defined below should be authenticated
     */

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
        return res.send(await this.workspaceService.getBotRefs(req.workspace))
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
        const flowViews = <FlowView[]>req.body.dirtyFlows

        await this.flowService.saveAll(botId, flowViews, req.body.cleanFlows)
        res.sendStatus(201)
      })
    )

    this.router.get(
      '/actions',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.flows'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const actions = await this.actionService.forBot(botId).listActions()
        res.send(Serialize(actions))
      })
    )

    const mediaUploadMulter = multer({
      fileFilter: (req, file, cb) => {
        let allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif']

        const uploadConfig = this.botpressConfig!.fileUpload
        if (uploadConfig && uploadConfig.allowedMimeTypes) {
          allowedMimeTypes = uploadConfig.allowedMimeTypes
        }

        if (allowedMimeTypes.includes(file.mimetype)) {
          return cb(undefined, true)
        }

        cb(new Error(`Invalid mime type (${file.mimetype})`), false)
      },
      limits: {
        fileSize: asBytes(_.get(this.botpressConfig, 'fileUpload.maxFileSize', DEFAULT_MAX_SIZE))
      }
    }).single('file')

    this.router.post(
      '/media',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.media'),
      this.asyncMiddleware(async (req, res) => {
        mediaUploadMulter(req, res, async err => {
          const email = req.tokenUser!.email
          if (err) {
            debugMedia(`failed (${email} from ${req.ip})`, err.message)
            return res.sendStatus(400)
          }

          const file = req['file']
          const botId = req.params.botId
          const fileName = await this.mediaService.saveFile(botId, file.originalname, file.buffer)

          debugMedia(
            `success (${email} from ${req.ip}). file: ${fileName} %o`,
            _.pick(file, 'originalname', 'mimetype', 'size')
          )

          const url = `/api/v1/bots/${botId}/media/${fileName}`
          res.json({ url })
        })
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
          ? await this.notificationService.markAsRead(botId, notificationId)
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
          ? await this.notificationService.archive(botId, notificationId)
          : await this.notificationService.archiveAll(botId)
        res.sendStatus(201)
      })
    )
  }
}

import axios from 'axios'
import { Logger } from 'botpress/sdk'
import { checkRule } from 'common/auth'
import LicensingService from 'common/licensing-service'
import { HTTPServer } from 'core/app/server'
import { resolveAsset, resolveIndexPaths } from 'core/app/server-utils'
import { BotService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config/config-loader'
import { JobService } from 'core/distributed'
import { AlertingService, MonitoringService } from 'core/health'
import { LogsRepository } from 'core/logger'
import { MessagingService } from 'core/messaging'
import { ModuleLoader } from 'core/modules'
import { sendSuccess } from 'core/routers'
import { CustomRouter } from 'core/routers/customRouter'
import { AuthStrategies, AuthService, TOKEN_AUDIENCE, assertSuperAdmin, checkTokenHeader } from 'core/security'
import { WorkspaceService } from 'core/users'
import express, { RequestHandler, Router } from 'express'
import httpsProxyAgent from 'https-proxy-agent'
import _ from 'lodash'

import AuthRouter from './auth/auth-router'
import HealthRouter from './health/health-router'
import ManagementRouter from './management/management-router'
import UserRouter from './user/user-router'
import { fixMappingMw } from './utils/apiMapper'
import WorkspaceRouter from './workspace/workspace-router'

export interface AdminServices {
  logger: Logger
  authService: AuthService
  workspaceService: WorkspaceService
  botService: BotService
  moduleLoader: ModuleLoader
  configProvider: ConfigProvider
  ghostService: GhostService
  monitoringService: MonitoringService
  logsRepository: LogsRepository
  licensingService: LicensingService
  alertingService: AlertingService
  jobService: JobService
  authStrategies: AuthStrategies
  messagingService: MessagingService
}

class AdminRouter extends CustomRouter {
  private checkTokenHeader: RequestHandler
  private managementRouter: ManagementRouter
  private healthRouter: HealthRouter
  private workspaceRouter: WorkspaceRouter
  private authRouter: AuthRouter
  private userRouter: UserRouter

  constructor(
    logger: Logger,
    private authService: AuthService,
    workspaceService: WorkspaceService,
    botService: BotService,
    private licensingService: LicensingService,
    ghostService: GhostService,
    private configProvider: ConfigProvider,
    monitoringService: MonitoringService,
    alertingService: AlertingService,
    moduleLoader: ModuleLoader,
    jobService: JobService,
    logsRepository: LogsRepository,
    authStrategies: AuthStrategies,
    messagingService: MessagingService,
    private httpServer: HTTPServer
  ) {
    super('Admin', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)

    const adminServices: AdminServices = {
      logger,
      authService: this.authService,
      licensingService: this.licensingService,
      workspaceService,
      botService,
      moduleLoader,
      configProvider,
      ghostService,
      monitoringService,
      logsRepository,
      alertingService,
      jobService,
      authStrategies,
      messagingService
    }

    this.managementRouter = new ManagementRouter(adminServices)
    this.healthRouter = new HealthRouter(adminServices)
    this.workspaceRouter = new WorkspaceRouter(adminServices)
    this.authRouter = new AuthRouter(adminServices)
    this.userRouter = new UserRouter(adminServices)
  }

  setupRoutes(app: express.Express) {
    // Redirect auth requests to the new router, since collaborators and chat users still need the admin ui to login
    app.use('/api/v1/auth', this.authRouter.router)

    // Rewrite old admin routes to the V2 version (slight changes in name only)
    app.use('/api/v1/admin', fixMappingMw, this.router)

    app.use('/api/v2/admin', this.router)

    app.get('/admin/env.js', async (req, res) => {
      const branding = await this.configProvider.getBrandingConfig('admin')
      const commonEnv = await this.httpServer.getCommonEnv()

      const segmentWriteKey = process.core_env.BP_DEBUG_SEGMENT
        ? 'P8pyBfskchwmKDFFi0MUIZgws85DUbDV' // Dev key from Segment
        : 'zE0mct7hGOZRtCyImjX9vT1NJ2TpfyGF' // Prod key from Segment

      res.contentType('text/javascript')
      res.send(`
      (function(window) {
          ${commonEnv}
          window.APP_VERSION = "${process.BOTPRESS_VERSION}";
          window.APP_NAME = "${branding.title}";
          window.APP_FAVICON = "${branding.favicon}";
          window.APP_CUSTOM_CSS = "${branding.customCss}";
          window.SEGMENT_WRITE_KEY = "${segmentWriteKey}";
        })(typeof window != 'undefined' ? window : {})
      `)
    })

    this.router.use('/auth', this.authRouter.router)
    this.router.use('/management', this.checkTokenHeader, this.managementRouter.router)
    this.router.use('/health', this.checkTokenHeader, assertSuperAdmin, this.healthRouter.router)
    this.router.use('/workspace', this.checkTokenHeader, this.workspaceRouter.router)
    this.router.use('/user', this.checkTokenHeader, this.userRouter.router)

    this.router.get(
      '/ping',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        sendSuccess(res, 'Pong', { serverId: process.SERVER_ID })
      })
    )

    this.router.get(
      '/permissions',
      this.asyncMiddleware(async (req, res) => {
        const { permissions, operation, resource } = req.body
        const valid = checkRule(permissions, operation, resource)
        res.send(valid)
      })
    )

    this.router.get('/license', (req, res) => {
      const license = {
        isPro: process.IS_PRO_ENABLED
      }
      res.send(license)
    })

    this.router.get(
      '/audit',
      this.asyncMiddleware(async (req, res) => {
        res.send(await this.licensingService.auditLicensing(req.headers['x-bp-audit'] as string))
      })
    )

    this.router.get(
      '/docker_images',
      this.asyncMiddleware(async (req, res) => {
        try {
          const { data } = await axios.get(
            'https://hub.docker.com/v2/repositories/botpress/server/tags/?page_size=125&page=1&name=v',
            process.PROXY ? { httpsAgent: new httpsProxyAgent(process.PROXY) } : {}
          )

          res.send(data)
        } catch (err) {
          res.send({ results: [] })
        }
      })
    )

    this.setupStaticRoutes(app)
  }

  setupStaticRoutes(app) {
    app.use('/admin', express.static(resolveAsset('admin/ui/public'), { index: false }))
    app.get(['/admin', '/admin/*'], resolveIndexPaths('admin/ui/public/index.html'))

    app.get('/', (req, res) => res.redirect(`${process.ROOT_PATH}/admin`))
  }
}

export default AdminRouter

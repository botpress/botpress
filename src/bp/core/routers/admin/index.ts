import { Logger } from 'botpress/sdk'
import { checkRule } from 'common/auth'
import LicensingService from 'common/licensing-service'
import { ConfigProvider } from 'core/config/config-loader'
import { GhostService } from 'core/services'
import { AlertingService } from 'core/services/alerting-service'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { BotService } from 'core/services/bot-service'
import { MonitoringService } from 'core/services/monitoring'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '../customRouter'
import { assertSuperAdmin, checkTokenHeader, loadUser } from '../util'

import { BotsRouter } from './bots'
import { LicenseRouter } from './license'
import { RolesRouter } from './roles'
import { ServerRouter } from './server'
import { UsersRouter } from './users'
import { VersioningRouter } from './versioning'

export class AdminRouter extends CustomRouter {
  private checkTokenHeader!: RequestHandler
  private botsRouter!: BotsRouter
  private usersRouter!: UsersRouter
  private licenseRouter!: LicenseRouter
  private versioningRouter!: VersioningRouter
  private rolesRouter!: RolesRouter
  private serverRouter!: ServerRouter
  private loadUser!: RequestHandler

  constructor(
    logger: Logger,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private botService: BotService,
    private licenseService: LicensingService,
    private ghostService: GhostService,
    configProvider: ConfigProvider,
    monitoringService: MonitoringService,
    alertingService: AlertingService
  ) {
    super('Admin', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.botsRouter = new BotsRouter(logger, this.workspaceService, this.botService, configProvider)
    this.usersRouter = new UsersRouter(logger, this.authService, this.workspaceService)
    this.licenseRouter = new LicenseRouter(logger, this.licenseService)
    this.versioningRouter = new VersioningRouter(logger, this.ghostService, this.botService)
    this.rolesRouter = new RolesRouter(logger, this.workspaceService)
    this.serverRouter = new ServerRouter(logger, monitoringService, alertingService, configProvider)
    this.loadUser = loadUser(this.authService)

    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/permissions',
      this.asyncMiddleware(async (req, res) => {
        const { permissions, operation, resource } = req.body
        const valid = checkRule(permissions, operation, resource)
        res.send(valid)
      })
    )

    router.get(
      '/all-permissions',
      this.asyncMiddleware(async (req, res) => {
        res.json(await this.authService.getResources())
      })
    )

    this.router.get('/license', (req, res) => {
      const license = {
        isPro: process.IS_PRO_ENABLED
      }
      res.send(license)
    })

    router.use('/bots', this.checkTokenHeader, this.botsRouter.router)
    router.use('/roles', this.checkTokenHeader, this.rolesRouter.router)
    router.use('/users', this.checkTokenHeader, this.loadUser, this.usersRouter.router)
    router.use('/license', this.checkTokenHeader, this.licenseRouter.router)
    router.use('/versioning', this.checkTokenHeader, assertSuperAdmin, this.versioningRouter.router)
    router.use('/server', this.checkTokenHeader, assertSuperAdmin, this.serverRouter.router)
  }
}

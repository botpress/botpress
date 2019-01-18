import { Logger } from 'botpress/sdk'
import { checkRule } from 'common/auth'
import LicensingService from 'common/licensing-service'
import { BotLoader } from 'core/bot-loader'
import { GhostService } from 'core/services'
import { AdminService } from 'core/services/admin/service'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { WorkspaceService } from 'core/services/workspace'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '..'
import { checkTokenHeader, loadUser } from '../util'

import { BotsRouter } from './bots'
import { LicenseRouter } from './license'
import { UsersRouter } from './users'
import { VersioningRouter } from './versioning'

export class AdminRouter implements CustomRouter {
  public readonly router: Router
  private checkTokenHeader!: RequestHandler
  private loadUser!: RequestHandler
  private botsRouter!: BotsRouter
  private usersRouter!: UsersRouter
  private licenseRouter!: LicenseRouter
  private versioningRouter!: VersioningRouter

  constructor(
    logger: Logger,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private licenseService: LicensingService,
    private ghostService: GhostService,
    private botLoader: BotLoader
  ) {
    this.router = Router({ mergeParams: true })
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.loadUser = loadUser(this.authService)
    this.botsRouter = new BotsRouter(logger, this.workspaceService)
    this.usersRouter = new UsersRouter(logger, this.authService, this.workspaceService)
    this.licenseRouter = new LicenseRouter(logger, this.licenseService)
    this.versioningRouter = new VersioningRouter(this.workspaceService, this.ghostService, this.botLoader)

    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.get('/permissions', async (req, res) => {
      const { permissions, operation, resource } = req.body
      const valid = checkRule(permissions, operation, resource)
      res.send(valid)
    })

    router.get('/all-permissions', async (req, res) => {
      res.json(await this.authService.getResources())
    })

    this.router.get('/license', (req, res) => {
      const license = {
        isPro: process.IS_PRO_ENABLED
      }
      res.send(license)
    })

    router.use('/bots', this.checkTokenHeader, this.loadUser, this.botsRouter.router)
    router.use('/users', this.checkTokenHeader, this.loadUser, this.usersRouter.router)
    router.use('/license', this.checkTokenHeader, this.loadUser, this.licenseRouter.router)
    router.use('/versioning', this.checkTokenHeader, this.versioningRouter.router)
  }
}

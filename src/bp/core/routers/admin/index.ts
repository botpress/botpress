import { Logger } from 'botpress/sdk'
import LicensingService from 'common/licensing-service'
import { AdminService } from 'core/services/admin/service'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '..'
import { checkTokenHeader, loadUser } from '../util'

import { LicenseRouter } from './license'
import { TeamsRouter } from './teams'
import { UsersRouter } from './users'

export class AdminRouter implements CustomRouter {
  public readonly router: Router
  private checkTokenHeader!: RequestHandler
  private loadUser!: RequestHandler
  private teamsRouter!: TeamsRouter
  private usersRouter!: UsersRouter
  private licenseRouter: LicenseRouter

  constructor(
    logger: Logger,
    private authService: AuthService,
    private adminService: AdminService,
    private licenseService: LicensingService
  ) {
    this.router = Router({ mergeParams: true })
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.loadUser = loadUser(this.authService)
    this.teamsRouter = new TeamsRouter(logger, this.authService, this.adminService)
    this.usersRouter = new UsersRouter(logger, this.authService, this.adminService)
    this.licenseRouter = new LicenseRouter(logger, this.licenseService)

    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.get('/all-permissions', async (req, res) => {
      res.json(await this.authService.getResources())
    })

    this.router.get('/license', (req, res) => {
      const license = {
        edition: process.env.EDITION
      }
      res.send(license)
    })

    router.use('/teams', this.checkTokenHeader, this.loadUser, this.teamsRouter.router)
    router.use('/users', this.checkTokenHeader, this.loadUser, this.usersRouter.router)
    router.use('/license', this.checkTokenHeader, this.loadUser, this.licenseRouter.router)
  }
}

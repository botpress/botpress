import { Logger } from 'botpress/sdk'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '..'
import AuthService, { TOKEN_AUDIENCE } from '../../services/auth/auth-service'
import { TeamsServiceFacade } from '../../services/auth/teams-service'
import { checkTokenHeader, loadUser } from '../util'

import { TeamsRouter } from './teams'

export class AdminRouter implements CustomRouter {
  public readonly router: Router
  private checkTokenHeader!: RequestHandler
  private loadUser!: RequestHandler
  private teamsRouter!: TeamsRouter

  constructor(
    logger: Logger,
    private authService: AuthService,
    private teamsService: TeamsServiceFacade,
    private edition: string
  ) {
    this.router = Router({ mergeParams: true })
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.loadUser = loadUser(this.authService)
    this.teamsRouter = new TeamsRouter(logger, this.authService, this.teamsService)

    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.get('/all-permissions', (req, res) => {
      res.json(this.authService.getResources())
    })

    this.router.get('/license', (req, res) => {
      const license = {
        edition: this.edition
      }
      res.send(license)
    })

    router.use('/teams', this.checkTokenHeader, this.loadUser, this.teamsRouter.router)
  }
}

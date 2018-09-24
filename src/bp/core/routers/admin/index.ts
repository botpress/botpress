import { RequestHandler, Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '..'
import AuthService, { TOKEN_AUDIENCE } from '../../services/auth/auth-service'
import TeamsService from '../../services/auth/teams-service'
import { checkTokenHeader, loadUser } from '../util'

import { TeamsRouter } from './teams'
import { Logger } from 'common/logging'

export class AdminRouter implements CustomRouter {
  public readonly router: Router
  private checkTokenHeader!: RequestHandler
  private loadUser!: RequestHandler
  private teamsRouter!: TeamsRouter

  constructor(logger: Logger, private authService: AuthService, private teamsService: TeamsService) {
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

    router.use('/teams', this.checkTokenHeader, this.loadUser, this.teamsRouter.router)
  }
}

import { resolve } from 'bluebird'
import { Logger } from 'botpress/sdk'
import { RequestWithUser } from 'core/misc/interfaces'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import TeamsService from 'core/services/auth/teams-service'
import { Request, RequestHandler, Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '.'
import { asyncMiddleware, checkTokenHeader, loadUser, success as sendSuccess, validateBodySchema } from './util'

const REVERSE_PROXY = !!process.env.REVERSE_PROXY

const getIp = (req: Request) =>
  (REVERSE_PROXY ? <string | undefined>req.headers['x-forwarded-for'] : undefined) || req.connection.remoteAddress

export class AuthRouter implements CustomRouter {
  public readonly router: Router
  private asyncMiddleware!: Function
  private checkTokenHeader!: RequestHandler
  private loadUser!: RequestHandler

  constructor(logger: Logger, private authService: AuthService, private teamsService: TeamsService) {
    this.router = Router({ mergeParams: true })
    this.asyncMiddleware = asyncMiddleware({ logger })
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.loadUser = loadUser(this.authService)

    this.setupRoutes()
  }

  login = async (req, res) => {
    const token = await this.authService.login(req.body.username, req.body.password, getIp(req))

    return sendSuccess(res, 'Login successful', { token })
  }

  getProfile = async (req, res) => {
    return sendSuccess(
      res,
      'Retrieved profile successfully',
      _.pick((req as RequestWithUser).dbUser, ['company', 'email', 'fullName', 'id', 'picture', 'provider', 'username'])
    )
  }

  getPermissions = async (req, res) => {
    return sendSuccess(
      res,
      "Retrieved team member's permissions successfully",
      await this.teamsService.getUserPermissions((req as RequestWithUser).dbUser!.id, req.params.teamId)
    )
  }

  sendSuccess = async (req, res) => {
    return sendSuccess(res)
  }

  setupRoutes() {
    const router = this.router

    router.get('/ping', this.checkTokenHeader, this.asyncMiddleware(this.sendSuccess))

    router.post('/login', this.asyncMiddleware(this.login))

    router.get('/me/profile', this.checkTokenHeader, this.loadUser, this.asyncMiddleware(this.getProfile))

    router.get(
      '/me/permissions/:teamId',
      this.checkTokenHeader,
      this.loadUser,
      this.asyncMiddleware(this.getPermissions)
    )
  }
}

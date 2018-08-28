import { Request, RequestHandler, Response } from 'express'
import Joi from 'joi'
import _ from 'lodash'

import { Logger } from '../../misc/interfaces'
import AuthService from '../../services/auth/auth-service'
import TeamsService from '../../services/auth/teams-service'

import { BaseRouter } from '../base-router'

import { TeamsRouter } from './teams'
import {
  asyncMiddleware,
  checkTokenHeader,
  error as sendError,
  loadUser,
  success as sendSuccess,
  validateBodySchema
} from './util'

const REVERSE_PROXY = !!process.env.REVERSE_PROXY

const authSchema = Joi.object().keys({
  username: Joi.string()
    .min(1)
    .trim()
    .required(),
  password: Joi.string()
    .min(1)
    .required()
})

export class AuthRouter extends BaseRouter {
  private asyncMiddleware!: Function
  private checkTokenHeader!: RequestHandler
  private loadUser!: RequestHandler
  private teamsRouter!: TeamsRouter

  constructor(private logger: Logger, private authService: AuthService, private teamsService: TeamsService) {
    super()
  }

  init() {
    this.asyncMiddleware = asyncMiddleware({ logger: this.logger })
    this.checkTokenHeader = checkTokenHeader(this.authService)
    this.loadUser = loadUser(this.authService)
    this.teamsRouter = new TeamsRouter(this.logger, this.authService, this.teamsService)
  }

  login = async (req, res) => {
    validateBodySchema(req, authSchema)

    const ip = (REVERSE_PROXY ? req.headers['x-forwarded-for'] : undefined) || req.connection.remoteAddress

    const token = await this.authService.login(req.body.username, req.body.password, ip)

    return sendSuccess(res, 'Login successful', { token })
  }

  register = async (req, res) => {
    validateBodySchema(req, authSchema)

    const ip = (REVERSE_PROXY ? req.headers['x-forwarded-for'] : undefined) || req.connection.remoteAddress

    const { token, userId } = await this.authService.register(req.body.username, req.body.password, ip)

    await this.teamsService.createNewTeam({ userId })

    return sendSuccess(res, 'Login successful', { token })
  }

  getProfile = async (req, res) => {
    return sendSuccess(
      res,
      'Retrieved profile successfully',
      _.pick(req.dbUser, ['company', 'email', 'fullName', 'id', 'picture', 'provider', 'username'])
    )
  }

  getPermissions = async (req, res) => {
    return sendSuccess(
      res,
      "Retrieved team member's permissions successfully",
      await this.teamsService.getUserPermissions(req.dbUser.id, req.params.teamId)
    )
  }

  setupRoutes() {
    const router = this.router

    router.post('/login', this.asyncMiddleware(this.login))

    router.post('/register', this.asyncMiddleware(this.register))

    router.get('/me/profile', this.checkTokenHeader, this.loadUser, this.asyncMiddleware(this.getProfile))

    router.get(
      '/me/permissions/:teamId',
      this.checkTokenHeader,
      this.loadUser,
      this.asyncMiddleware(this.getPermissions)
    )

    router.get('/all-permissions', (req, res) => {
      res.json(this.authService.getResources())
    })

    router.use('/teams', this.checkTokenHeader, this.loadUser, this.teamsRouter.router)
  }
}

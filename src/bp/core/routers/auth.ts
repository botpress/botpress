import { Logger } from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import { AuthConfig, RequestWithUser } from 'core/misc/interfaces'
import { AuthStrategies } from 'core/services/auth-strategies'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { WorkspaceService } from 'core/services/workspace-service'
import { Request, RequestHandler, Router } from 'express'
import Joi from 'joi'
import _ from 'lodash'

import { CustomRouter } from './customRouter'
import { BadRequestError, NotFoundError } from './errors'
import { checkTokenHeader, success as sendSuccess, validateBodySchema } from './util'

export class AuthRouter extends CustomRouter {
  private checkTokenHeader!: RequestHandler

  constructor(
    logger: Logger,
    private authService: AuthService,
    private configProvider: ConfigProvider,
    private workspaceService: WorkspaceService,
    private authStrategies: AuthStrategies
  ) {
    super('Auth', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)

    // tslint:disable-next-line: no-floating-promises
    this.setupRoutes()
  }

  login = async (req: Request, res) => {
    const token = await this.authService.login(req.body.email, req.body.password, req.body.newPassword, req.ip)

    return sendSuccess(res, 'Login successful', { token })
  }

  getAuthStrategy = async () => {
    const config = await this.configProvider.getBotpressConfig()
    const strategy = _.get(config, 'pro.auth.strategy', 'basic')
    const authEndpoint = _.get(config, 'pro.auth.options.authEndpoint')

    return { strategy, authEndpoint } as Partial<AuthConfig>
  }

  getAuthConfig = async () => {
    const usersList = await this.workspaceService.listUsers()
    const isFirstTimeUse = !usersList || !usersList.length

    return { isFirstTimeUse, ...(await this.getAuthStrategy()) } as AuthConfig
  }

  register = async (req: RequestWithUser, res) => {
    const config = await this.getAuthConfig()
    if (!config.isFirstTimeUse) {
      res.status(403).send(`Registration is disabled`)
    } else {
      const { email, password } = req.body
      if (email.length < 4 || password.length < 4) {
        throw new BadRequestError('Email or password is too short.')
      }
      const token = await this.authService.register(email, password, req.ip)
      return sendSuccess(res, 'Registration successful', { token })
    }
  }

  sendConfig = async (req, res) => {
    return sendSuccess(res, 'Auth Config', await this.getAuthConfig())
  }

  getProfile = async (req: RequestWithUser, res) => {
    const { tokenUser } = req
    const user = await this.authService.findUserByEmail(tokenUser!.email, [
      'company',
      'email',
      'provider',
      'firstname',
      'lastname'
    ])

    if (!user) {
      throw new NotFoundError(`User ${tokenUser!.email || ''} not found`)
    }

    const userRole = await this.workspaceService.getRoleForUser(user.email)

    const userProfile = {
      ...user,
      isSuperAdmin: tokenUser!.isSuperAdmin,
      fullName: [user!.firstname, user!.lastname].filter(Boolean).join(' '),
      permissions: userRole && userRole.rules
    }

    return sendSuccess(res, 'Retrieved profile successfully', userProfile)
  }

  updateProfile = async (req, res) => {
    validateBodySchema(
      req,
      Joi.object().keys({
        firstname: Joi.string()
          .min(0)
          .max(35)
          .trim()
          .required(),
        lastname: Joi.string()
          .min(0)
          .max(35)
          .trim()
          .required()
      })
    )

    await this.workspaceService.updateUser(req.tokenUser.email, {
      firstname: req.body.firstname,
      lastname: req.body.lastname
    })
    return sendSuccess(res, 'Updated profile successfully')
  }

  getPermissions = async (req, res) => {
    const { tokenUser } = <RequestWithUser>req
    const role = await this.workspaceService.getRoleForUser(tokenUser!.email)
    if (!role) {
      throw new NotFoundError(`Role for user "${tokenUser!.email}" doesn't exist`)
    }
    return sendSuccess(res, "Retrieved user's permissions successfully", role.rules)
  }

  sendSuccess = async (req, res) => {
    return sendSuccess(res)
  }

  async setupRoutes() {
    const router = this.router

    const authStrategy = await this.getAuthStrategy()

    if (process.IS_PRO_ENABLED && authStrategy.strategy !== 'basic') {
      this.authStrategies.setup(router)
    } else {
      router.post('/login', this.asyncMiddleware(this.login))
      router.post('/register', this.asyncMiddleware(this.register))
    }

    router.get('/config', this.asyncMiddleware(this.sendConfig))

    router.get('/ping', this.checkTokenHeader, this.asyncMiddleware(this.sendSuccess))

    router.get('/me/profile', this.checkTokenHeader, this.asyncMiddleware(this.getProfile))

    router.post('/me/profile', this.checkTokenHeader, this.asyncMiddleware(this.updateProfile))

    router.get('/me/permissions', this.checkTokenHeader, this.asyncMiddleware(this.getPermissions))

    router.get(
      '/refresh',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req: RequestWithUser, res) => {
        const config = await this.configProvider.getBotpressConfig()

        if (config.jwtToken && config.jwtToken.allowRefresh) {
          const newToken = await this.authService.refreshToken(req.tokenUser!)
          sendSuccess(res, 'Token refreshed successfully', { newToken })
        } else {
          const [, token] = req.headers.authorization!.split(' ')
          sendSuccess(res, 'Token not refreshed, sending back original', { newToken: token })
        }
      })
    )
  }
}
